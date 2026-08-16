-- =============================================================================
-- Migration: Sync webhook trigger state to match remote
-- Created: 2026-08-16
-- Updated: 2026-08-16
-- Purpose: Ensure supabase_functions.http_request() trigger function and
--          inventory_vector_worker_webhook_trigger exist in correct state
-- =============================================================================

-- 1. Drop old wrapper function if it exists (from earlier migration)
DROP FUNCTION IF EXISTS supabase_functions.http_request(text, jsonb, jsonb, integer);

-- 2. Drop trigger first (required before dropping/replacing function)
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- 3. Create/replace the generic trigger function
CREATE OR REPLACE FUNCTION supabase_functions.http_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_id bigint;
  payload jsonb;
  url text;
  method text;
  headers jsonb;
  params jsonb;
  timeout_ms integer;
  webhook_secret text;
  raw_body text;
  signature text;
BEGIN
  url := TG_ARGV[0];
  method := TG_ARGV[1];
  headers := TG_ARGV[2]::jsonb;
  params := TG_ARGV[3]::jsonb;
  timeout_ms := TG_ARGV[4]::integer;
  webhook_secret := TG_ARGV[5];

  IF TG_OP = 'INSERT' THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', null
    );
  ELSIF TG_OP = 'UPDATE' THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', to_jsonb(OLD)
    );
  ELSIF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', null,
      'old_record', to_jsonb(OLD)
    );
  END IF;

  raw_body := payload::text;
  signature := 'sha256=' || encode(extensions.hmac(raw_body, webhook_secret, 'sha256'::text), 'hex');
  headers := headers || jsonb_build_object('x-webhook-signature', signature);

  request_id := net.http_post(
    url,
    payload,
    params,
    headers,
    timeout_ms
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 4. Recreate trigger with correct configuration
CREATE TRIGGER inventory_vector_worker_webhook_trigger
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://game-inventori-vector-worker.aitiga226.workers.dev/webhooks/supabase',
    'POST',
    '{"Content-Type": "application/json"}',
    '{}',
    5000,
    '577b3db1bf6b23c0bcf772e4f6308fc2bae3a2c80f7fa68e5ae3050a2be695a8'
  );
