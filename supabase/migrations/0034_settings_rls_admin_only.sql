-- 0034: Restrict settings write access to OWNER/ADMIN only.
--
-- Current state (from 0008 + 0013):
--   - settings_public_read: SELECT for anon + authenticated
--   - settings_authenticated_all: ALL operations for all authenticated users
--
-- This migration replaces settings_authenticated_all with:
--   - settings_authenticated_read: SELECT for all authenticated users
--   - settings_admin_write: INSERT/UPDATE/DELETE gated by is_admin()
--
-- Non-admin authenticated users (MEMBER, VIEWER) can still read all
-- settings but cannot modify them.

-- 1) Drop the existing all-authenticated write policy
DROP POLICY IF EXISTS "settings_authenticated_all" ON public.settings;

-- 2) SELECT: all authenticated users can read
CREATE POLICY "settings_authenticated_read"
ON public.settings FOR SELECT TO authenticated
USING (true);

-- 3) INSERT / UPDATE / DELETE: admin only
CREATE POLICY "settings_admin_insert"
ON public.settings FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "settings_admin_update"
ON public.settings FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "settings_admin_delete"
ON public.settings FOR DELETE TO authenticated
USING (is_admin());