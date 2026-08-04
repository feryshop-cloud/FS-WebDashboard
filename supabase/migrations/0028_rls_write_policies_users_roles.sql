-- 0028: RLS write policies for users/roles (settings user & role management).
--
-- The settings module (actions/settings.ts) lets admins create users, change a
-- user's role/status, and edit role permissions. Before this migration those
-- writes were rejected by RLS because `users`/`roles` had no INSERT/UPDATE/
-- DELETE policies.
--
-- All write policies are gated by is_admin() (OWNER/ADMIN), consistent with
-- the coarse admin model enforced elsewhere (is_admin() is SECURITY DEFINER,
-- so no policy recursion). Self-demotion out of admin is prevented naturally
-- by `WITH CHECK (is_admin())` on the post-update row.

-- users: admins may insert/update/delete user rows.
DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
CREATE POLICY "users_admin_insert"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "users_admin_update" ON public.users;
CREATE POLICY "users_admin_update"
  ON public.users FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete"
  ON public.users FOR DELETE TO authenticated
  USING (is_admin());

-- roles: admins may manage role config (incl. permissions JSON).
DROP POLICY IF EXISTS "roles_admin_insert" ON public.roles;
CREATE POLICY "roles_admin_insert"
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "roles_admin_update" ON public.roles;
CREATE POLICY "roles_admin_update"
  ON public.roles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "roles_admin_delete" ON public.roles;
CREATE POLICY "roles_admin_delete"
  ON public.roles FOR DELETE TO authenticated
  USING (is_admin());
