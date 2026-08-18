-- ============================================================
-- Migration: Add RPC Function & pg_cron Schedule for Sweeping Expired Orders
-- Applied: 2026-08-18
-- ============================================================

-- 1. Create SECURITY DEFINER function to sweep expired orders in PostgreSQL
CREATE OR REPLACE FUNCTION public.sweep_expired_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swept_count integer;
  v_now_sec bigint;
BEGIN
  v_now_sec := extract(epoch from now())::bigint;

  UPDATE public.orders
  SET payment_status = 'expired'::public.order_payment_status
  WHERE payment_status = 'pending'::public.order_payment_status
    AND expired_time IS NOT NULL
    AND expired_time <= v_now_sec;

  GET DIAGNOSTICS v_swept_count = ROW_COUNT;
  RETURN v_swept_count;
END;
$$;

-- Grant execution to authenticated & service_role
GRANT EXECUTE ON FUNCTION public.sweep_expired_orders() TO authenticated, service_role;

-- 2. Enable pg_cron extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule pg_cron job every minute
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('sweep-expired-orders-every-minute')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sweep-expired-orders-every-minute');

    PERFORM cron.schedule(
      'sweep-expired-orders-every-minute',
      '* * * * *',
      'SELECT public.sweep_expired_orders()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
