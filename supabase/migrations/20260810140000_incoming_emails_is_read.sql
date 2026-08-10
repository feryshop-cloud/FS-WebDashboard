-- Migration: 20260810140000_incoming_emails_is_read.sql
-- Description: Persist read/unread state for incoming emails in the DB.
-- Admins may only toggle the is_read column (no other fields).

ALTER TABLE public.incoming_emails
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "incoming_emails_admin_update_read" ON public.incoming_emails;
CREATE POLICY "incoming_emails_admin_update_read"
  ON public.incoming_emails
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
