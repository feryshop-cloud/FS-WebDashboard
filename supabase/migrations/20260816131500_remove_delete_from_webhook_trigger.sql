-- =============================================================================
-- Migration: Remove DELETE from webhook trigger
-- Created: 2026-08-16
-- Purpose: inventory_vector_worker_webhook_trigger should only fire on
--          INSERT and UPDATE, not DELETE
-- =============================================================================

-- 1. Drop existing trigger
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- 2. Recreate trigger without DELETE
CREATE TRIGGER inventory_vector_worker_webhook_trigger
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://game-inventori-vector-worker.aitiga226.workers.dev/webhooks/supabase',
    'POST',
    '{"Content-Type": "application/json"}',
    '{}',
    5000
  );
