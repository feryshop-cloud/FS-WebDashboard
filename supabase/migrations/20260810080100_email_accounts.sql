-- Migration: 20260810080100_email_accounts.sql
-- Description: Create email_accounts table and link incoming_emails with cascade delete

-- 1. Create email_accounts table
CREATE TABLE IF NOT EXISTS public.email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    imap_host TEXT NOT NULL,
    imap_port INT NOT NULL DEFAULT 993,
    imap_user TEXT NOT NULL,
    imap_pass_encrypted TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_email 
    ON public.email_accounts(email);

CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active 
    ON public.email_accounts(is_active);

-- 3. Add email_account_id to incoming_emails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incoming_emails' AND column_name = 'email_account_id'
  ) THEN
    ALTER TABLE public.incoming_emails ADD COLUMN email_account_id UUID;
  END IF;
END $$;

-- 4. Add foreign key with ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_incoming_emails_email_account'
  ) THEN
    ALTER TABLE public.incoming_emails 
      ADD CONSTRAINT fk_incoming_emails_email_account 
      FOREIGN KEY (email_account_id) 
      REFERENCES public.email_accounts(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Index for cascade lookups
CREATE INDEX IF NOT EXISTS idx_incoming_emails_email_account_id 
    ON public.incoming_emails(email_account_id);

-- 5. Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for email_accounts
CREATE POLICY "Admins can manage email accounts"
    ON public.email_accounts
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Add email_accounts to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_accounts;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
