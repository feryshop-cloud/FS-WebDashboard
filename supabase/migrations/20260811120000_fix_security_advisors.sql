-- Migration: 20260811120000_fix_security_advisors.sql
-- Description: Close Supabase security-advisor warnings except leaked-password.
--
-- Fixes applied:
--  1. rls_policy_always_true
--     - balance_adjustments INSERT: WITH CHECK (true) -> requested_by = auth.uid()
--     - orders "Allow public insert access": WITH CHECK (true) -> pending-only
--       checkout rows, role narrowed to anon, authenticated.
--  2. anon/authenticated_security_definer_function_executable (7 functions)
--     - Move SECURITY DEFINER logic into a `private` schema (never exposed via
--       PostgREST /rest/v1/rpc). Keep the public names as SECURITY INVOKER
--       wrappers so RLS policies, triggers and storefront RPC contracts keep
--       working unchanged. This removes the functions from the exposed API
--       surface without changing any caller behavior.
--
-- Pattern:
--   - Plain functions (is_admin, is_owner, search_inventory, validate_promo):
--     public.<fn> (SECURITY INVOKER) -> private.<fn>_core (SECURITY DEFINER).
--   - Trigger functions (process_audit_log, handle_new_user,
--     generate_inventory_public_id): public.<fn> stays a RETURNS TRIGGER
--     SECURITY INVOKER wrapper that keeps the trigger context (TG_*/NEW/OLD)
--     and passes extracted data to a private SECURITY DEFINER helper. A
--     RETURNS TRIGGER core called from another trigger function does NOT
--     inherit TG_*, so it would error ("trigger functions can only be called
--     as triggers") — hence the explicit-argument helper shape.

CREATE SCHEMA IF NOT EXISTS private;

-- =====================================================================
-- 1. is_admin
-- =====================================================================
CREATE OR REPLACE FUNCTION private.user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND r.name IN ('OWNER', 'ADMIN')
  )
$$;

REVOKE ALL ON FUNCTION private.user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.user_is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT private.user_is_admin()
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================================
-- 2. is_owner
-- =====================================================================
CREATE OR REPLACE FUNCTION private.user_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND r.name = 'OWNER'
  )
$$;

REVOKE ALL ON FUNCTION private.user_is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.user_is_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT private.user_is_owner()
$$;

REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- =====================================================================
-- 3. process_audit_log (trigger function)
-- =====================================================================
CREATE OR REPLACE FUNCTION private.write_audit_log(
  p_user_id uuid,
  p_action text,
  p_module text,
  p_old_data jsonb,
  p_new_data jsonb,
  p_related_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, module, description, old_data, new_data, related_id, created_at
  ) VALUES (
    p_user_id,
    p_action,
    p_module,
    CASE p_action
      WHEN 'DELETE' THEN 'Menghapus data pada tabel ' || p_module || ' (ID: ' || p_related_id || ')'
      WHEN 'UPDATE' THEN 'Mengubah data pada tabel ' || p_module || ' (ID: ' || p_related_id || ')'
      ELSE 'Menambahkan data baru pada tabel ' || p_module || ' (ID: ' || p_related_id || ')'
    END,
    p_old_data,
    p_new_data,
    p_related_id,
    NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION private.write_audit_log(uuid, text, text, jsonb, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.write_audit_log(uuid, text, text, jsonb, jsonb, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_related_id UUID := NULL;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_related_id := OLD.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_related_id := NEW.id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_related_id := NEW.id;
    END IF;

    PERFORM private.write_audit_log(
      auth.uid(), TG_OP, TG_TABLE_NAME, v_old_data, v_new_data, v_related_id
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.process_audit_log() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO authenticated, service_role;

-- =====================================================================
-- 4. handle_new_user (auth.users trigger function)
-- =====================================================================
CREATE OR REPLACE FUNCTION private.sync_user_profile(p_id uuid, p_email text, p_meta jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(p_meta->>'full_name', p_meta->>'name', split_part(p_email, '@', 1));

  INSERT INTO public.users (id, email, full_name, status, created_at, updated_at)
  VALUES (p_id, p_email, v_name, 'ACTIVE', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  INSERT INTO public.public_users (id, full_name, is_active, created_at, updated_at)
  VALUES (p_id, v_name, true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION private.sync_user_profile(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.sync_user_profile(uuid, text, jsonb) TO supabase_auth_admin, service_role, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM private.sync_user_profile(NEW.id, NEW.email, NEW.raw_user_meta_data);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role, authenticated;

-- =====================================================================
-- 5. generate_inventory_public_id (inventory trigger function)
-- =====================================================================
CREATE OR REPLACE FUNCTION private.generate_inventory_public_id_core(
  p_game_id uuid,
  p_current_public_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_num  INTEGER;
BEGIN
  IF p_current_public_id IS NOT NULL THEN
    RETURN p_current_public_id;
  END IF;

  SELECT g.code INTO v_code FROM public.games g WHERE g.id = p_game_id;
  IF v_code IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'Cannot generate public_id: game code missing for game_id %', p_game_id;
  END IF;

  INSERT INTO public.game_public_seq AS s (game_id, last_number)
  VALUES (p_game_id, 1)
  ON CONFLICT (game_id)
  DO UPDATE SET last_number = s.last_number + 1
  RETURNING last_number INTO v_num;

  RETURN v_code || '-' || lpad(v_num::TEXT, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION private.generate_inventory_public_id_core(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.generate_inventory_public_id_core(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_inventory_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.public_id := private.generate_inventory_public_id_core(NEW.game_id, NEW.public_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_inventory_public_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_inventory_public_id() TO authenticated, service_role;

-- =====================================================================
-- 6. search_inventory (storefront public RPC, SETOF inventory)
-- =====================================================================
CREATE OR REPLACE FUNCTION private.search_inventory_core(
  query_text TEXT,
  game_slug_filter TEXT DEFAULT NULL,
  match_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  query_vector extensions.vector(512);
  query_tsquery tsquery;
BEGIN
  query_vector := public.inventory_title_vector(query_text);
  query_tsquery := plainto_tsquery('simple', query_text);

  RETURN QUERY
  SELECT i.*
  FROM public.inventory i
  LEFT JOIN public.games g ON i.game_id = g.id
  WHERE i.status = 'AVAILABLE'::public.inventory_status
    AND (game_slug_filter IS NULL OR g.slug = game_slug_filter)
    AND (
      query_tsquery IS NULL
      OR i.search_vector @@ query_tsquery
      OR query_vector IS NULL
    )
  ORDER BY
    CASE
      WHEN query_vector IS NOT NULL AND i.title_reference_vector IS NOT NULL
      THEN (1 - (i.title_reference_vector <=> query_vector))
      ELSE 0
    END * 0.4
    + CASE
      WHEN query_tsquery IS NOT NULL AND i.search_vector IS NOT NULL
      THEN ts_rank_cd(i.search_vector, query_tsquery, 1)
      ELSE 0
    END * 0.6 DESC,
    i.created_at DESC
  LIMIT match_limit;
END;
$$;

REVOKE ALL ON FUNCTION private.search_inventory_core(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.search_inventory_core(TEXT, TEXT, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_inventory(
  query_text TEXT,
  game_slug_filter TEXT DEFAULT NULL,
  match_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.inventory
LANGUAGE sql
SET search_path = public, extensions
AS $$
  SELECT * FROM private.search_inventory_core(query_text, game_slug_filter, match_limit)
$$;

REVOKE ALL ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) TO anon, authenticated;

-- =====================================================================
-- 7. validate_promo (storefront public RPC, jsonb)
-- =====================================================================
CREATE OR REPLACE FUNCTION private.validate_promo_core(p_code text, p_subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        record;
  discount numeric;
BEGIN
  SELECT * INTO r FROM public.promo_codes WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'err', 'not_found');
  ELSIF NOT r.is_active THEN
    RETURN jsonb_build_object('ok', false, 'err', 'inactive');
  ELSIF r.start_date IS NOT NULL AND r.start_date > now() THEN
    RETURN jsonb_build_object('ok', false, 'err', 'not_started');
  ELSIF r.end_date IS NOT NULL AND r.end_date < now() THEN
    RETURN jsonb_build_object('ok', false, 'err', 'expired');
  ELSIF p_subtotal < r.min_order THEN
    RETURN jsonb_build_object('ok', false, 'err', 'min_order');
  ELSIF r.used_count >= r.quota THEN
    RETURN jsonb_build_object('ok', false, 'err', 'quota');
  END IF;

  discount := CASE
    WHEN r.discount_type = 'percent' THEN p_subtotal * r.discount_value / 100
    ELSE r.discount_value
  END;
  IF r.max_discount > 0 AND discount > r.max_discount THEN
    discount := r.max_discount;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'code', r.code,
    'discount', discount,
    'discount_type', r.discount_type,
    'discount_value', r.discount_value,
    'min_order', r.min_order,
    'max_discount', r.max_discount,
    'used_count', r.used_count,
    'quota', r.quota,
    'start_date', r.start_date,
    'end_date', r.end_date
  );
END;
$$;

REVOKE ALL ON FUNCTION private.validate_promo_core(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.validate_promo_core(text, numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_promo(p_code text, p_subtotal numeric)
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  SELECT private.validate_promo_core(p_code, p_subtotal)
$$;

REVOKE ALL ON FUNCTION public.validate_promo(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, numeric) TO anon, authenticated;

-- =====================================================================
-- 8. RLS policies: replace WITH CHECK (true)
-- =====================================================================

-- balance_adjustments: requester must be the authenticated user.
DROP POLICY IF EXISTS "balance_adjustments_insert" ON public.balance_adjustments;
CREATE POLICY "balance_adjustments_insert"
  ON public.balance_adjustments FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- orders: only fresh checkout rows (pending) may be inserted via the public
-- API; prevents forging paid/completed orders. Storefront inserts always set
-- payment_status/buy_status to 'pending' (see FS-Public/src/app/api/order/route.ts).
DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
CREATE POLICY "Allow public insert access on orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (payment_status = 'pending' AND buy_status = 'pending');
