-- Migration: 0041_worker_heartbeat_and_seq_fn_grants.sql
-- Description: Clean up side effects of 0040.
--   - worker_heartbeat lost its only policy -> add service_role (workers)
--     and admin (monitoring) so RLS is intentional, not an empty gap.
--   - generate_inventory_public_id became SECURITY DEFINER -> revoke anon so
--     it is not callable as a public RPC (still executable by authenticated
--     and service_role because the inventory BEFORE INSERT trigger needs it).

-- 1. worker_heartbeat policies (workers run as service_role -> RLS bypass;
--    admins may read for monitoring).
DROP POLICY IF EXISTS "worker_heartbeat_service_all" ON public.worker_heartbeat;
CREATE POLICY "worker_heartbeat_service_all"
  ON public.worker_heartbeat
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "worker_heartbeat_admin_read" ON public.worker_heartbeat;
CREATE POLICY "worker_heartbeat_admin_read"
  ON public.worker_heartbeat
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 2. Lock generate_inventory_public_id away from public REST callers.
REVOKE ALL ON FUNCTION public.generate_inventory_public_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_inventory_public_id()
  TO authenticated, service_role;