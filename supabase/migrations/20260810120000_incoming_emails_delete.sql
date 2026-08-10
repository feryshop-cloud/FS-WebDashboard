-- Migration: 20260810120000_incoming_emails_delete.sql
-- Description: Allow admins to delete incoming emails (single / bulk from the
-- dashboard inbox). Buyer-facing webmail keeps read-only access.

DROP POLICY IF EXISTS "incoming_emails_admin_delete" ON public.incoming_emails;
CREATE POLICY "incoming_emails_admin_delete"
  ON public.incoming_emails
  FOR DELETE
  TO authenticated
  USING (is_admin());
