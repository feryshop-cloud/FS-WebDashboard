-- Migration: 0037_audit_products_and_user_sync.sql
-- Description:
--   1. Attach the generic audit trigger to `products` so topup-product
--      INSERT/UPDATE/DELETE are audit-logged automatically (parity with
--      finance_ledger/deals/stocks/accounts/problem_cases).
--   2. Extend handle_new_user() so new auth.users rows also populate
--      `public_users` (the FK target of audit_logs.user_id and
--      inventory.added_by), preventing silent FK violations on audit writes.
--   3. Backfill existing auth.users missing from public_users.

-- 1. Attach generic audit trigger to products
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 2. Extend handle_new_user() to also sync public_users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'Aktif',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  INSERT INTO public.public_users (id, full_name, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 3. Backfill any auth.users missing from public_users
INSERT INTO public.public_users (id, full_name, is_active, created_at, updated_at)
SELECT
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  true,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.public_users p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
