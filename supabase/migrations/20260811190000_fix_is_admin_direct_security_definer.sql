-- Migration: 20260811190000_fix_is_admin_direct_security_definer.sql
-- Description: Buat public.is_admin() langsung SECURITY DEFINER tanpa indireksi schema private.
--
-- Masalah Utama:
--   PostgreSQL RLS saat mengevaluasi RLS Policy pada `audit_logs` (dan tabel admin lain):
--   1. RLS audit_logs memanggil `public.is_admin()` (SECURITY INVOKER di 0048/0052).
--   2. public.is_admin() memanggil private.user_is_admin().
--   3. Karena dipanggil dalam konteks RLS subquery dari SECURITY INVOKER, konteks
--      auth.uid() & RLS context pada `public.users` tetap aktif dan membingungkan
--      PostgreSQL planner saat join `public.users` & `public.roles`, menyebabkan RLS LOCK RECURSION / TIMEOUT 8.2s!
--
-- Solusi Tuntas:
--   Kembalikan `public.is_admin()` sebagai SECURITY DEFINER langsung (atau bypass RLS di dalamnya)
--   sehingga PostgreSQL planner mengeksekusinya sebagai superuser/table-owner murni,
--   langsung melompati pemeriksaan RLS pada `users` & `roles`, tanpa overhead RPC/schema indireksi.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
