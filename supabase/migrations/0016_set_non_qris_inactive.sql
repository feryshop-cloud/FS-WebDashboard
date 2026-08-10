-- Migration 0016: Set metode pembayaran selain QRIS menjadi inactive
-- Idempotent: skip jika tabel belum ada (dibuat di 0018_topup_products_schema).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    UPDATE public.payment_methods
    SET status = 'inactive'
    WHERE UPPER(payment_id) != 'QRIS' AND UPPER(id) != 'QRIS';

    UPDATE public.payment_methods
    SET status = 'active'
    WHERE UPPER(payment_id) = 'QRIS' OR UPPER(id) = 'QRIS';
  END IF;
END $$;
