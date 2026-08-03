-- Migration 0016: Set metode pembayaran selain QRIS menjadi inactive

UPDATE public.payment_methods
SET status = 'inactive'
WHERE UPPER(payment_id) != 'QRIS' AND UPPER(id) != 'QRIS';

UPDATE public.payment_methods
SET status = 'active'
WHERE UPPER(payment_id) = 'QRIS' OR UPPER(id) = 'QRIS';
