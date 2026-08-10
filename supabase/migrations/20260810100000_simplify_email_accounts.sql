-- Migration: 20260810100000_simplify_email_accounts.sql
-- Description: Simplify email_accounts — email delivered via Cloudflare Email Routing,
-- not IMAP. Drop unused imap_* columns.

ALTER TABLE public.email_accounts
    DROP COLUMN IF EXISTS imap_host,
    DROP COLUMN IF EXISTS imap_port,
    DROP COLUMN IF EXISTS imap_user,
    DROP COLUMN IF EXISTS imap_pass_encrypted;
