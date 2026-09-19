-- Migration: Stock SKU structure with Game Code and Number from 3000
-- Examples: FF-3000, FF-3001, MLBB-3000, etc.

-- 1. Counter sequence table per game_code
CREATE TABLE IF NOT EXISTS public.game_stock_seq (
  game_code VARCHAR(10) PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 2999
);

ALTER TABLE public.game_stock_seq ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read game_stock_seq" ON public.game_stock_seq;
CREATE POLICY "Allow authenticated read game_stock_seq" ON public.game_stock_seq
  FOR SELECT TO authenticated, service_role USING (true);

-- 2. Generator function to get & increment SKU
CREATE OR REPLACE FUNCTION public.generate_stock_sku(p_category VARCHAR)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_num  INTEGER;
BEGIN
  -- Resolve game code from games table
  SELECT g.code INTO v_code
  FROM public.games g
  WHERE LOWER(g.name) = LOWER(p_category)
     OR LOWER(g.slug) = LOWER(p_category)
     OR LOWER(g.title) = LOWER(p_category)
     OR p_category ILIKE '%' || g.name || '%'
  ORDER BY (CASE WHEN LOWER(g.name) = LOWER(p_category) THEN 1 ELSE 2 END)
  LIMIT 1;

  IF v_code IS NULL OR v_code = '' THEN
    v_code := public.game_code_from_name(p_category);
    IF v_code IS NULL OR v_code = '' THEN
      v_code := 'GAME';
    END IF;
  END IF;

  -- Ensure we start from 3000
  INSERT INTO public.game_stock_seq (game_code, last_number)
  VALUES (v_code, 3000)
  ON CONFLICT (game_code)
  DO UPDATE SET last_number = GREATEST(public.game_stock_seq.last_number + 1, 3000)
  RETURNING last_number INTO v_num;

  RETURN v_code || '-' || v_num::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Peek next SKU for preview in frontend without incrementing
CREATE OR REPLACE FUNCTION public.peek_next_stock_sku(p_category VARCHAR)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_last INTEGER;
BEGIN
  SELECT g.code INTO v_code
  FROM public.games g
  WHERE LOWER(g.name) = LOWER(p_category)
     OR LOWER(g.slug) = LOWER(p_category)
     OR LOWER(g.title) = LOWER(p_category)
     OR p_category ILIKE '%' || g.name || '%'
  ORDER BY (CASE WHEN LOWER(g.name) = LOWER(p_category) THEN 1 ELSE 2 END)
  LIMIT 1;

  IF v_code IS NULL OR v_code = '' THEN
    v_code := public.game_code_from_name(p_category);
    IF v_code IS NULL OR v_code = '' THEN
      v_code := 'GAME';
    END IF;
  END IF;

  SELECT last_number INTO v_last
  FROM public.game_stock_seq
  WHERE game_code = v_code;

  IF v_last IS NULL OR v_last < 2999 THEN
    RETURN v_code || '-3000';
  END IF;

  RETURN v_code || '-' || (v_last + 1)::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_stock_sku(VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.peek_next_stock_sku(VARCHAR) TO authenticated, service_role;

-- 4. Update process_stock_purchase stored procedure
CREATE OR REPLACE FUNCTION public.process_stock_purchase(
  p_category VARCHAR,
  p_name VARCHAR,
  p_account_details TEXT,
  p_username VARCHAR,
  p_password VARCHAR,
  p_capital_price NUMERIC,
  p_post_price NUMERIC,
  p_current_price NUMERIC,
  p_seller_info TEXT,
  p_internal_notes TEXT,
  p_purchase_payment_status purchase_payment_status,
  p_payment_account_id UUID,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_stock_id UUID;
  v_game_id UUID;
  v_specs TEXT;
  v_sku TEXT;
BEGIN
  v_stock_id := gen_random_uuid();
  v_sku := public.generate_stock_sku(p_category);

  -- If p_name contains an AUTO placeholder or preview SKU, replace with real v_sku
  IF p_name ~ '^[A-Z0-9]+-(?:AUTO|\d{4,}) \| ' OR p_name ~ '^AUTO \| ' THEN
    p_name := v_sku || ' | ' || regexp_replace(p_name, '^[A-Z0-9]+-(?:AUTO|\d{4,}) \| |^AUTO \| ', '');
  END IF;

  -- 1. Insert into stocks (Legacy ERP stock table) with generated SKU
  INSERT INTO public.stocks (
    id, sku, category, name, account_details, username, password,
    capital_price, post_price, current_price, status, purchase_date,
    seller_info, internal_notes, admin_id, purchase_payment_status, payment_account_id
  ) VALUES (
    v_stock_id, v_sku, p_category, p_name, p_account_details, p_username, p_password,
    p_capital_price, p_post_price, p_current_price, 'AVAILABLE', NOW(),
    p_seller_info, p_internal_notes, p_admin_id, p_purchase_payment_status, p_payment_account_id
  );

  -- 2. If LUNAS, handle finance ledger and account balance
  IF p_purchase_payment_status = 'LUNAS' THEN
    IF p_payment_account_id IS NULL THEN
      RAISE EXCEPTION 'payment_account_id is required when status is LUNAS';
    END IF;

    -- Insert Finance Ledger (OUT)
    INSERT INTO public.finance_ledger (
      account_id, transaction_type, amount, stock_id, description, admin_id
    ) VALUES (
      p_payment_account_id, 'STOCK_PURCHASE', -p_capital_price, v_stock_id, 'Pembelian Stok Lunas', p_admin_id
    );

    -- Deduct Account Balance
    UPDATE public.accounts 
    SET balance = balance - p_capital_price 
    WHERE id = p_payment_account_id;
  END IF;

  -- 3. Resolve game_id for inventory table lookup
  SELECT id INTO v_game_id
  FROM public.games
  WHERE LOWER(name) = LOWER(p_category)
     OR LOWER(slug) = LOWER(p_category)
     OR LOWER(title) = LOWER(p_category)
     OR p_category ILIKE '%' || name || '%'
  ORDER BY (CASE WHEN LOWER(name) = LOWER(p_category) THEN 1 ELSE 2 END)
  LIMIT 1;

  -- If game_id is not matched directly, fallback to the first active game
  IF v_game_id IS NULL THEN
    SELECT id INTO v_game_id
    FROM public.games
    WHERE is_active = TRUE
    ORDER BY sort_order ASC
    LIMIT 1;
  END IF;

  -- Prepare specifications summary (safe format)
  v_specs := COALESCE(NULLIF(TRIM(p_account_details), ''), p_name);

  -- 4. Insert or update corresponding item in inventory table
  IF v_game_id IS NOT NULL THEN
    INSERT INTO public.inventory (
      id,
      game_id,
      public_id,
      added_by,
      title_reference,
      account_specs,
      capital_price,
      asking_price,
      status
    ) VALUES (
      v_stock_id,
      v_game_id,
      v_sku,
      p_admin_id,
      p_name,
      v_specs,
      ROUND(p_capital_price)::INTEGER,
      ROUND(p_current_price)::INTEGER,
      'AVAILABLE'::public.inventory_status
    )
    ON CONFLICT (id) DO UPDATE SET
      game_id = EXCLUDED.game_id,
      public_id = EXCLUDED.public_id,
      title_reference = EXCLUDED.title_reference,
      account_specs = EXCLUDED.account_specs,
      capital_price = EXCLUDED.capital_price,
      asking_price = EXCLUDED.asking_price,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;

  RETURN v_stock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Backfill existing legacy STK- stocks to new format starting at 3000
DO $$
DECLARE
  r RECORD;
  v_new_sku TEXT;
BEGIN
  FOR r IN
    SELECT id, category, sku, name FROM public.stocks
    WHERE sku LIKE 'STK-%' OR sku IS NULL
    ORDER BY created_at ASC
  LOOP
    v_new_sku := public.generate_stock_sku(r.category);
    UPDATE public.stocks
    SET sku = v_new_sku,
        name = CASE
          WHEN name LIKE 'STK-% | %' THEN v_new_sku || ' | ' || split_part(name, ' | ', 2)
          ELSE name
        END
    WHERE id = r.id;

    -- Also sync inventory public_id if matched
    UPDATE public.inventory
    SET public_id = v_new_sku
    WHERE id = r.id;
  END LOOP;
END;
$$;
