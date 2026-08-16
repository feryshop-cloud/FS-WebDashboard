-- =============================================================================
-- Migration: Vector worker webhook trigger with http_request wrapper
-- Created: 2026-08-16
-- Purpose: Send real-time webhook to vector-worker when inventory records change
--           Uses supabase_functions schema with reusable http_request wrapper
-- =============================================================================

-- 1. Create schema for reusable database functions
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- 2. Create reusable HTTP request wrapper function
CREATE OR REPLACE FUNCTION supabase_functions.http_request(
  p_url text,
  p_body jsonb DEFAULT '{}'::jsonb,
  p_headers jsonb DEFAULT '{}'::jsonb,
  p_timeout_ms integer DEFAULT 5000
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_response record;
BEGIN
  SELECT * INTO v_response
  FROM net.http_post(
    url := p_url,
    body := p_body,
    headers := p_headers,
    timeout_milliseconds := p_timeout_ms
  );

  -- Log non-2xx responses for debugging
  IF v_response.status NOT BETWEEN 200 AND 299 THEN
    RAISE WARNING 'HTTP request to % returned status %', p_url, v_response.status;
  END IF;
END;
$$;

-- 3. Grant execute permission to service_role (needed for triggers)
GRANT EXECUTE ON FUNCTION supabase_functions.http_request(text, jsonb, jsonb, integer) TO service_role;

-- 4. Create trigger function that uses the wrapper
CREATE OR REPLACE FUNCTION public.send_vector_worker_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret text := 'ISI_SECRET_VECTOR_WEBHOOK_ANDA_DISINI'; -- Replace with actual VECTOR_WEBHOOK_SECRET
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

  -- Send webhook via wrapper function
  PERFORM supabase_functions.http_request(
    p_url := 'https://game-inventori-vector-worker.aitiga226.workers.dev/webhooks/supabase',
    p_body := v_payload,
    p_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-signature', v_signature
    ),
    p_timeout_ms := 5000
  );

  -- Return appropriate row for trigger
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 5. Create trigger on inventory table
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;
CREATE TRIGGER inventory_vector_worker_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.send_vector_worker_webhook();
