-- Migration: 20260904090000_create_digiflazz_transactions.sql
-- Description: Table for storing Digiflazz top-up transactions, audit trails, and reconciliation states.

CREATE TABLE IF NOT EXISTS public.digiflazz_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    ref_id TEXT UNIQUE NOT NULL,
    buyer_sku_code TEXT NOT NULL,
    customer_no TEXT NOT NULL,
    amount NUMERIC(12,0) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'unknown')),
    serial_number TEXT,
    digiflazz_rc TEXT,
    digiflazz_message TEXT,
    digiflazz_response JSONB,
    balance_before NUMERIC(12,0),
    balance_after NUMERIC(12,0),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (Service role only by default)
ALTER TABLE public.digiflazz_transactions ENABLE ROW LEVEL SECURITY;

-- Admin read policy for monitoring dashboard
CREATE POLICY "Admins can view digiflazz_transactions"
    ON public.digiflazz_transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_digi_tx_order_id ON public.digiflazz_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_digi_tx_status_pending ON public.digiflazz_transactions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_digi_tx_created_at ON public.digiflazz_transactions(created_at DESC);
