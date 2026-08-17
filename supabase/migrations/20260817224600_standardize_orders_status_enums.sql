-- ============================================================
-- Migration: Standardize orders table status columns to PostgreSQL ENUM
-- Applied: 2026-08-17
-- Table: orders (payment_status, buy_status)
-- ============================================================

-- STEP 1: DROP dependent RLS policy & column default constraints
DROP POLICY IF EXISTS orders_insert ON public.orders;
ALTER TABLE public.orders ALTER COLUMN payment_status DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN buy_status DROP DEFAULT;

-- STEP 2: Normalize existing data to exact enum values
-- Normalize payment_status
UPDATE public.orders 
SET payment_status = 'success' 
WHERE payment_status IN ('COMPLETED', 'PAID', 'LUNAS', 'success');

UPDATE public.orders 
SET payment_status = 'expired' 
WHERE payment_status IN ('EXPIRED', 'expired');

UPDATE public.orders 
SET payment_status = 'failed' 
WHERE payment_status IN ('FAILED', 'GAGAL', 'CANCELLED', 'failed');

UPDATE public.orders 
SET payment_status = 'pending' 
WHERE payment_status IN ('PENDING', 'UNPAID', 'MENUNGGU', 'menunggu', 'pending') 
   OR payment_status IS NULL;

-- Normalize buy_status
UPDATE public.orders 
SET buy_status = 'success' 
WHERE buy_status IN ('SUCCESS', 'SUKSES', 'success');

UPDATE public.orders 
SET buy_status = 'processing' 
WHERE buy_status IN ('PROCESSING', 'PROSES', 'DIPROSES', 'processing');

UPDATE public.orders 
SET buy_status = 'failed' 
WHERE buy_status IN ('FAILED', 'GAGAL', 'BATAL', 'failed');

UPDATE public.orders 
SET buy_status = 'pending' 
WHERE buy_status IN ('PENDING', 'MENUNGGU', 'pending') 
   OR buy_status IS NULL;

-- STEP 3: CREATE ENUM types in public schema if not exists
DO $$ BEGIN
  CREATE TYPE public.order_payment_status AS ENUM (
    'pending',
    'paid',
    'success',
    'failed',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_buy_status AS ENUM (
    'pending',
    'processing',
    'success',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 4: ALTER COLUMN to use new ENUM types
ALTER TABLE public.orders
  ALTER COLUMN payment_status TYPE public.order_payment_status
  USING payment_status::public.order_payment_status;

ALTER TABLE public.orders
  ALTER COLUMN buy_status TYPE public.order_buy_status
  USING buy_status::public.order_buy_status;

-- STEP 5: Set clean DEFAULT values matching the ENUMs
ALTER TABLE public.orders 
  ALTER COLUMN payment_status SET DEFAULT 'pending'::public.order_payment_status;

ALTER TABLE public.orders 
  ALTER COLUMN buy_status SET DEFAULT 'pending'::public.order_buy_status;

-- STEP 6: Recreate dependent RLS policy with new ENUM types
CREATE POLICY orders_insert ON public.orders
  FOR INSERT
  WITH CHECK (
    (payment_status = 'pending'::public.order_payment_status AND buy_status = 'pending'::public.order_buy_status)
    OR (SELECT is_admin())
  );
