-- =============================================================================
-- Migration: Enable pgcrypto + pg_net, create webhook trigger for inventory
-- Created: 2026-08-16
-- Purpose: Send real-time webhook to vector-worker when inventory records change
-- =============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- 2. Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION public.send_vector_worker_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret text := '577b3db1bf6b23c0bcf772e4f6308fc2bae3a2c80f7fa68e5ae3050a2be695a8'; -- Replace with actual VECTOR_WEBHOOK_SECRET
  v_payload jsonb;
  v_raw_body text;
  v_signature text;
BEGIN
  -- Build payload based on operation type
  IF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(OLD)
    );
  ELSE
    v_payload := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    );
  END IF;

  -- Prepare raw body and compute HMAC-SHA256 signature
  v_raw_body := v_payload::text;
  v_signature := encode(hmac(v_raw_body, v_secret, 'sha256'), 'hex');

  -- Fire HTTP POST to vector-worker
  PERFORM net.http_post(
    url := 'https://game-inventori-vector-worker.aitiga226.workers.dev/webhooks/supabase',
    body := v_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-signature', v_signature
    ),
    timeout_milliseconds := 5000
  );

  -- Return appropriate row for trigger
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 4. Create trigger on inventory table
CREATE TRIGGER inventory_vector_worker_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.send_vector_worker_webhook();


-- 5. Buat fungsi wrapper http_request yang dibutuhkan UI Dashboard
CREATE OR REPLACE FUNCTION supabase_functions.http_request(
  url text,
  method text,
  headers jsonb,
  params jsonb,
  timeout_ms integer
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := url,
    headers := headers,
    body := params,
    timeout_milliseconds := timeout_ms
  ) INTO request_id;
  RETURN request_id;
END;
$$;
