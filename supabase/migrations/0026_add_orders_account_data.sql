-- Migration: 0026_add_orders_account_data.sql
-- Description: Add missing account_data jsonb column to orders.
-- The orders table (migration 0020) omitted account_data even though both
-- FS-Public (src/lib/db/schema.ts) and the admin dashboard
-- (app/dashboard/topup-orders/page.tsx) read/write it. This caused storefront
-- order inserts to fail silently and the admin order detail page to never
-- render account details.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS account_data jsonb;

COMMENT ON COLUMN public.orders.account_data IS 'Dynamic account/player fields submitted with the order (e.g. id, server, nickname, email).';
