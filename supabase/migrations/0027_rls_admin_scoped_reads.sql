-- 0027: Restrict reads on users/roles/public_users to self-or-admin.
--
-- Before this migration these three tables had `FOR SELECT TO authenticated
-- USING (true)`, so any authenticated user (including MEMBER/VIEWER) could read
-- the full user list (emails, names) and the role/permission config.
--
-- Why `SECURITY DEFINER` on is_admin(): the admin check reads `public.users`
-- via `auth.uid()`. A policy ON `users` that evaluates is_admin() would
-- re-enter the users table and cause "infinite recursion detected in policy
-- for relation users". Running the function with the privileges of its owner
-- (postgres, bypassing RLS) removes that cycle. The returned boolean is
-- unchanged, so every existing policy that already uses is_admin() keeps its
-- exact behavior.

CREATE OR REPLACE FUNCTION public.is_admin()
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

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- users: everyone may read their own row; admins may read the full list.
DROP POLICY IF EXISTS "users_authenticated_read" ON public.users;
CREATE POLICY "users_self_read"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "users_admin_read"
  ON public.users FOR SELECT TO authenticated
  USING (is_admin());

-- roles: only admins (permission config is not public information).
DROP POLICY IF EXISTS "roles_authenticated_read" ON public.roles;
CREATE POLICY "roles_admin_read"
  ON public.roles FOR SELECT TO authenticated
  USING (is_admin());

-- public_users: only admins (no non-service runtime reader exists).
DROP POLICY IF EXISTS "public_users_authenticated_read" ON public.public_users;
CREATE POLICY "public_users_admin_read"
  ON public.public_users FOR SELECT TO authenticated
  USING (is_admin());
