-- Migration: 20260811180000_fix_is_admin_performance.sql
-- Description: Fix RLS recursion / timeout pada public.is_admin()
--
-- Masalah:
--   RLS policy pada public.audit_logs (dan tabel-tabel admin lainnya) memanggil
--   public.is_admin() -> private.user_is_admin().
--   Di dalam private.user_is_admin(), query melakukan:
--     SELECT FROM public.users u JOIN public.roles r ON ...
--   Tetapi tabel `public.users` sendiri memiliki RLS enabled!
--   Saat PostgreSQL mengevaluasi RLS audit_logs -> panggil user_is_admin() ->
--   membaca public.users -> PostgreSQL mencoba mengevaluasi RLS public.users ->
--   panggil public.is_admin() lagi -> RECURSIVE RLS LOCK -> Statement Timeout (8.2s)!
--
-- Solusi:
--   Bypass RLS pada query internal user_is_admin() dengan memastikan fungsi tersebut
--   membaca langsung dari `public_users` atau melakukan query dengan `SET LOCAL rls = off` /
--   atau menggunakan SECURITY DEFINER yang mengakses tabel dasar tanpa terhalang RLS recursion,
--   serta menambahkan INDEX pada `public.users(id, role_id)`.

CREATE INDEX IF NOT EXISTS idx_users_id_role_id ON public.users(id, role_id);
CREATE INDEX IF NOT EXISTS idx_public_users_id_role_id ON public.public_users(id, role_id);

CREATE OR REPLACE FUNCTION private.user_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Jalankan query langsung. SECURITY DEFINER milik superuser/owner melompati RLS
  -- jika dipastikan tidak terpengaruh session user RLS pada tabel users/roles.
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND r.name IN ('OWNER', 'ADMIN')
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

GRANT EXECUTE ON FUNCTION private.user_is_admin() TO authenticated, anon;
