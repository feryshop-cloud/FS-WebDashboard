-- Migration: 0017_webmail_schema.sql
-- Description: Create tables and RLS policies for WebMail (incoming_emails, rate_limit_attempts)

-- 1. Create incoming_emails table
CREATE TABLE IF NOT EXISTS public.incoming_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    subject TEXT,
    message_id TEXT NOT NULL,
    otp_code TEXT,
    raw_body_snippet TEXT,
    category TEXT DEFAULT 'general',
    visibility TEXT NOT NULL DEFAULT 'buyer' CHECK (visibility IN ('buyer', 'admin_only')),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uniq_recipient_message UNIQUE (recipient_email, message_id)
);

-- Index for fast inbox queries
CREATE INDEX IF NOT EXISTS idx_incoming_emails_recipient_visibility 
    ON public.incoming_emails(recipient_email, visibility, received_at DESC);

-- 2. Create rate_limit_attempts table (for Edge Functions change-mailbox-password)
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_attempts_email 
    ON public.rate_limit_attempts(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.incoming_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for incoming_emails
-- Public (anon) and authenticated users can SELECT only emails marked for 'buyer'
CREATE POLICY "Allow public read access to buyer emails"
    ON public.incoming_emails
    FOR SELECT
    TO anon, authenticated
    USING (visibility = 'buyer');

-- 5. RLS Policies for rate_limit_attempts
-- No public access. Access is restricted to Service Role (bypasses RLS) or Authenticated Admin.

-- 6. Add incoming_emails to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incoming_emails;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if publication or privileges differ in local env
END $$;
