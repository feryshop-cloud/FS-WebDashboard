-- =============================================================================
-- Migration: Fix inventory vector worker trigger loop
-- Created: 2026-09-19
-- Purpose: Restrict inventory_vector_worker_webhook_trigger to only fire on
--          INSERT or UPDATE OF title_reference, account_specs.
--          This prevents recursive infinite webhook loops when vector-worker
--          updates title_reference_vector, as well as unnecessary triggers
--          when updating unrelated inventory columns (e.g. status, price).
-- =============================================================================

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- 2. Recreate trigger restricted to title_reference and account_specs columns
CREATE TRIGGER inventory_vector_worker_webhook_trigger
  AFTER INSERT OR UPDATE OF title_reference, account_specs ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://game-inventori-vector-worker.aitiga226.workers.dev/webhooks/supabase',
    'POST',
    '{"Content-Type": "application/json"}',
    '{}',
    5000,
    '577b3db1bf6b23c0bcf772e4f6308fc2bae3a2c80f7fa68e5ae3050a2be695a8'
  );
