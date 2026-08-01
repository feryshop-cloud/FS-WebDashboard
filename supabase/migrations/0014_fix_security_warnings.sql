-- Fix Supabase security advisor warnings (leaked_password protection intentionally left alone):
--   1. function_search_path_mutable  -> pin SET search_path on all flagged functions
--   2. extension_in_public           -> move pgvector to the `extensions` schema
--   3. rls_policy_always_true        -> replace USING(true) admin policies with a role check
--   4. anon/authenticated can EXECUTE SECURITY DEFINER
--      -> process_* become SECURITY INVOKER + anon revoked; backfill restricted to service_role

-- =====================================================================
-- 1) Move pgvector out of public
-- =====================================================================
ALTER EXTENSION vector SET SCHEMA extensions;

-- inventory_title_vector references the vector type; rebuild it against the
-- new schema-qualified type so runtime casts still resolve.
CREATE OR REPLACE FUNCTION public.inventory_title_vector(
  p_text TEXT,
  p_dim INTEGER DEFAULT 512
)
RETURNS extensions.vector
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
DECLARE
  v_vec REAL[];
  v_token TEXT;
  v_idx INTEGER;
  v_norm REAL;
  v_i INTEGER;
  v_hash BIGINT;
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN
    RETURN NULL;
  END IF;

  v_vec := array_fill(0.0::REAL, ARRAY[p_dim]);

  FOR v_token IN
    SELECT word FROM unnest(
      string_to_array(regexp_replace(lower(p_text), '[^a-z0-9]+', ' ', 'g'), ' ')
    ) AS word
    WHERE word <> ''
  LOOP
    v_hash := abs(hashtextextended(v_token, 0));
    v_idx := (v_hash % p_dim)::INTEGER;
    v_vec[v_idx + 1] := v_vec[v_idx + 1] + 1.0;
  END LOOP;

  v_norm := 0.0;
  FOR v_i IN 1..p_dim LOOP
    v_norm := v_norm + v_vec[v_i] * v_vec[v_i];
  END LOOP;

  IF v_norm = 0 THEN
    RETURN NULL;
  END IF;

  FOR v_i IN 1..p_dim LOOP
    v_vec[v_i] := v_vec[v_i] / sqrt(v_norm);
  END LOOP;

  RETURN v_vec::extensions.vector;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inventory_title_vector(TEXT, INTEGER) TO anon, authenticated;

-- =====================================================================
-- 2) backfill_inventory_vectors: only service_role may run it now
--    (the Railway worker switched from the anon key to the service key)
-- =====================================================================
REVOKE ALL ON FUNCTION public.backfill_inventory_vectors() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_inventory_vectors() TO service_role;

-- =====================================================================
-- 3) process_* RPCs: SECURITY INVOKER + pinned search_path + no anon.
--    The dashboard calls these with an authenticated session, so the role
--    checks on the *_admin_access policies apply to the invoking user.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.process_payment(
  p_deal_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_notes text,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_deal deals%ROWTYPE;
  v_payment_id UUID;
  v_stock_id UUID;
  v_deal_price NUMERIC;
  v_new_total NUMERIC;
  v_new_percentage NUMERIC;
  v_new_deal_status deal_status;
  v_new_stock_status stock_status;
BEGIN
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  SELECT deal_items.stock_id INTO v_stock_id
  FROM deal_items
  WHERE deal_items.deal_id = p_deal_id
  ORDER BY created_at
  LIMIT 1;

  v_stock_id := COALESCE(v_deal.stock_id, v_stock_id);
  v_deal_price := COALESCE(NULLIF(v_deal.deal_price, 0), NULLIF(v_deal.total_deal_price, 0), 0);

  INSERT INTO payments (deal_id, account_id, amount, payment_type, status, notes, admin_id, handled_by)
  VALUES (p_deal_id, p_account_id, p_amount, 'IN', 'COMPLETED', p_notes, p_admin_id, p_admin_id)
  RETURNING id INTO v_payment_id;

  INSERT INTO finance_ledger (account_id, transaction_type, amount, deal_id, payment_id, stock_id, description, notes, ref_id, admin_id, created_by)
  VALUES (p_account_id, 'PAYMENT_IN', p_amount, p_deal_id, v_payment_id, v_stock_id, p_notes, p_notes, p_deal_id::TEXT, p_admin_id, p_admin_id);

  UPDATE accounts
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_account_id;

  v_new_total := v_deal.total_paid + p_amount;

  IF v_deal_price > 0 THEN
    v_new_percentage := (v_new_total / v_deal_price) * 100;
  ELSE
    v_new_percentage := 100;
  END IF;

  IF v_new_percentage >= 100 THEN
    v_new_deal_status := 'PAID';
    v_new_stock_status := 'SOLD';
  ELSIF v_new_percentage >= 70 THEN
    v_new_deal_status := 'LIMITED_ACCESS';
    v_new_stock_status := 'LIMITED_ACCESS';
  ELSIF v_new_percentage >= 20 THEN
    v_new_deal_status := 'BOOKED';
    v_new_stock_status := 'BOOKED';
  ELSE
    v_new_deal_status := 'DRAFT';
    v_new_stock_status := 'AVAILABLE';
  END IF;

  UPDATE deals
  SET total_paid = v_new_total,
      remaining_balance = v_deal_price - v_new_total,
      payment_percentage = v_new_percentage,
      status = v_new_deal_status,
      updated_at = NOW()
  WHERE id = p_deal_id;

  IF v_stock_id IS NOT NULL THEN
    UPDATE stocks
    SET status = v_new_stock_status,
        updated_at = NOW(),
        sold_date = CASE WHEN v_new_stock_status = 'SOLD' AND sold_date IS NULL THEN NOW() ELSE sold_date END,
        booking_date = CASE WHEN v_new_stock_status IN ('BOOKED', 'LIMITED_ACCESS', 'SOLD') AND booking_date IS NULL THEN NOW() ELSE booking_date END
    WHERE id = v_stock_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment(uuid, uuid, numeric, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_payment(uuid, uuid, numeric, text, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.process_stock_purchase(
  p_category character varying,
  p_name character varying,
  p_account_details text,
  p_username character varying,
  p_password character varying,
  p_capital_price numeric,
  p_post_price numeric,
  p_current_price numeric,
  p_seller_info text,
  p_internal_notes text,
  p_purchase_payment_status public.purchase_payment_status,
  p_payment_account_id uuid,
  p_admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_stock_id UUID;
BEGIN
  INSERT INTO stocks (
    category, name, account_details, username, password,
    capital_price, post_price, current_price, status, purchase_date,
    seller_info, internal_notes, admin_id, purchase_payment_status, payment_account_id
  ) VALUES (
    p_category, p_name, p_account_details, p_username, p_password,
    p_capital_price, p_post_price, p_current_price, 'AVAILABLE', NOW(),
    p_seller_info, p_internal_notes, p_admin_id, p_purchase_payment_status, p_payment_account_id
  ) RETURNING id INTO v_stock_id;

  IF p_purchase_payment_status = 'LUNAS' THEN
    IF p_payment_account_id IS NULL THEN
      RAISE EXCEPTION 'payment_account_id is required when status is LUNAS';
    END IF;

    INSERT INTO finance_ledger (
      account_id, transaction_type, amount, stock_id, description, admin_id
    ) VALUES (
      p_payment_account_id, 'STOCK_PURCHASE', -p_capital_price, v_stock_id, 'Pembelian Stok Lunas', p_admin_id
    );

    UPDATE accounts
    SET balance = balance - p_capital_price
    WHERE id = p_payment_account_id;
  END IF;

  RETURN v_stock_id;
END;
$$;

REVOKE ALL ON FUNCTION public.process_stock_purchase(character varying, character varying, text, character varying, character varying, numeric, numeric, numeric, text, text, public.purchase_payment_status, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_stock_purchase(character varying, character varying, text, character varying, character varying, numeric, numeric, numeric, text, text, public.purchase_payment_status, uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.process_account_transfer(
  p_source_account_id uuid,
  p_dest_account_id uuid,
  p_amount numeric,
  p_admin_fee numeric,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_source_name VARCHAR(255);
  v_dest_name VARCHAR(255);
  v_source_balance NUMERIC;
BEGIN
  IF p_source_account_id = p_dest_account_id THEN
    RAISE EXCEPTION 'Source and destination accounts must be different';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be greater than zero';
  END IF;

  IF p_admin_fee < 0 THEN
    RAISE EXCEPTION 'Admin fee cannot be negative';
  END IF;

  IF p_source_account_id < p_dest_account_id THEN
    SELECT name, balance INTO v_source_name, v_source_balance FROM accounts WHERE id = p_source_account_id FOR UPDATE;
    SELECT name INTO v_dest_name FROM accounts WHERE id = p_dest_account_id FOR UPDATE;
  ELSE
    SELECT name INTO v_dest_name FROM accounts WHERE id = p_dest_account_id FOR UPDATE;
    SELECT name, balance INTO v_source_name, v_source_balance FROM accounts WHERE id = p_source_account_id FOR UPDATE;
  END IF;

  IF v_source_name IS NULL THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;

  IF v_dest_name IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  IF v_source_balance < (p_amount + p_admin_fee) THEN
    RAISE EXCEPTION 'Saldo tidak mencukupi untuk melakukan transfer (Saldo: Rp %, Butuh: Rp %)',
      v_source_balance, (p_amount + p_admin_fee);
  END IF;

  UPDATE accounts
  SET balance = balance - (p_amount + p_admin_fee),
      updated_at = NOW()
  WHERE id = p_source_account_id;

  UPDATE accounts
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_dest_account_id;

  INSERT INTO finance_ledger (account_id, transaction_type, amount, description, admin_id, created_at)
  VALUES (p_source_account_id, 'TRANSFER_OUT', -p_amount, 'Mutasi Saldo ke ' || v_dest_name, p_admin_id, NOW());

  INSERT INTO finance_ledger (account_id, transaction_type, amount, description, admin_id, created_at)
  VALUES (p_dest_account_id, 'TRANSFER_IN', p_amount, 'Mutasi Saldo dari ' || v_source_name, p_admin_id, NOW());

  IF p_admin_fee > 0 THEN
    INSERT INTO finance_ledger (account_id, transaction_type, amount, description, admin_id, created_at)
    VALUES (p_source_account_id, 'TRANSFER_OUT', -p_admin_fee, 'Biaya Admin Mutasi', p_admin_id, NOW());
  END IF;

END;
$$;

REVOKE ALL ON FUNCTION public.process_account_transfer(uuid, uuid, numeric, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_account_transfer(uuid, uuid, numeric, numeric, uuid) TO authenticated, service_role;

-- =====================================================================
-- 4) set_settings_updated_at trigger: pin search_path
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 5) RLS: replace USING(true) admin policies with a role check so the
--    dashboard keeps working for OWNER/ADMIN while blocking any other
--    authenticated (e.g. open sign-ups) and satisfying the advisor.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND r.name IN ('OWNER', 'ADMIN')
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- accounts
DROP POLICY IF EXISTS "accounts_authenticated_all" ON public.accounts;
CREATE POLICY "accounts_admin_access" ON public.accounts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_authenticated_all" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_access" ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- customers
DROP POLICY IF EXISTS "customers_authenticated_all" ON public.customers;
CREATE POLICY "customers_admin_access" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- deal_items
DROP POLICY IF EXISTS "deal_items_authenticated_all" ON public.deal_items;
CREATE POLICY "deal_items_admin_access" ON public.deal_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- deals
DROP POLICY IF EXISTS "deals_authenticated_all" ON public.deals;
CREATE POLICY "deals_admin_access" ON public.deals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- finance_ledger
DROP POLICY IF EXISTS "finance_ledger_authenticated_all" ON public.finance_ledger;
CREATE POLICY "finance_ledger_admin_access" ON public.finance_ledger
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- inventory (public AVAILABLE reads kept via inventory_public_select)
DROP POLICY IF EXISTS "inventory_authenticated_all" ON public.inventory;
CREATE POLICY "inventory_admin_access" ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- payments
DROP POLICY IF EXISTS "payments_authenticated_all" ON public.payments;
CREATE POLICY "payments_admin_access" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- problem_cases
DROP POLICY IF EXISTS "problem_cases_authenticated_all" ON public.problem_cases;
CREATE POLICY "problem_cases_admin_access" ON public.problem_cases
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- settings (public read kept via settings_public_read)
DROP POLICY IF EXISTS "settings_authenticated_all" ON public.settings;
CREATE POLICY "settings_admin_access" ON public.settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- stock_histories
DROP POLICY IF EXISTS "stock_histories_authenticated_all" ON public.stock_histories;
CREATE POLICY "stock_histories_admin_access" ON public.stock_histories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- stocks
DROP POLICY IF EXISTS "stocks_authenticated_all" ON public.stocks;
CREATE POLICY "stocks_admin_access" ON public.stocks
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- trade_in_items
DROP POLICY IF EXISTS "trade_in_items_authenticated_all" ON public.trade_in_items;
CREATE POLICY "trade_in_items_admin_access" ON public.trade_in_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
