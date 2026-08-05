-- Migration: 0033_create_worker_heartbeat.sql
-- Description: Create worker_heartbeat table for WebMail IMAP worker monitoring

CREATE TABLE IF NOT EXISTS public.worker_heartbeat (
    worker_name TEXT PRIMARY KEY,
    last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.worker_heartbeat ENABLE ROW LEVEL SECURITY;

-- Allow public / anon / authenticated access to insert/update worker heartbeat
CREATE POLICY "Allow public access to worker_heartbeat"
ON public.worker_heartbeat FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default record for imap-worker-main
INSERT INTO public.worker_heartbeat (worker_name, last_ping)
VALUES ('imap-worker-main', NOW())
ON CONFLICT (worker_name) DO NOTHING;
