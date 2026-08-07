-- Migration: 0039_secure_function_grants.sql
-- Description: Close SECURITY DEFINER / trigger-function exposure flagged by
-- Supabase advisors, add the missing rate_limit_attempts policy, and pin
-- search_path on remaining functions.

-- 1. backfill_inventory_vectors: only service_role (vector-worker uses the
--    service role key). 0022 accidentally re-granted anon+authenticated.
REVOKE ALL ON FUNCTION public.backfill_inventory_vectors() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_inventory_vectors() TO service_role;

-- 2. process_audit_log: trigger function (SECURITY DEFINER). Needed only by
--    DML from authenticated (app server actions) and service_role (seed/worker).
--    anon must not call it via REST.
REVOKE ALL ON FUNCTION public.process_audit_log() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_audit_log() TO authenticated, service_role;

-- 3. handle_new_user: auth.users trigger. Fired by supabase_auth_admin on
--    signup, plus service_role / authenticated for backfills.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role, authenticated;

-- 4. Pin search_path on the functions the advisor flagged as mutable
--    (SECURITY DEFINER ones are the priority; the rest are hygiene).
ALTER FUNCTION public.process_audit_log() SET search_path = public;
ALTER FUNCTION public.generate_inventory_public_id() SET search_path = public;
ALTER FUNCTION public.generate_game_code() SET search_path = public;
ALTER FUNCTION public.game_code_from_name(TEXT) SET search_path = public;
ALTER FUNCTION public.inventory_search_vector_update() SET search_path = public;

-- 5. rate_limit_attempts had RLS enabled but no policies (no access for
--    authenticated, wide-open for anon was never granted — but advisor flags
--    the missing policy). Give admins access, keep anon out. service_role
--    bypasses RLS for the Edge Function path.
DROP POLICY IF EXISTS "rate_limit_attempts_admin_all" ON public.rate_limit_attempts;
CREATE POLICY "rate_limit_attempts_admin_all"
  ON public.rate_limit_attempts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
