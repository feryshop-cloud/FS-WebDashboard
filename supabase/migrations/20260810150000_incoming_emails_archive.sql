-- Migration: 20260810150000_incoming_emails_archive.sql
-- Description: Add archived flag to incoming emails. Admins may toggle
-- is_archived (and is_read) — generalized admin update policy.

ALTER TABLE public.incoming_emails
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "incoming_emails_admin_update_read" ON public.incoming_emails;
DROP POLICY IF EXISTS "incoming_emails_admin_update" ON public.incoming_emails;
CREATE POLICY "incoming_emails_admin_update"
  ON public.incoming_emails
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
