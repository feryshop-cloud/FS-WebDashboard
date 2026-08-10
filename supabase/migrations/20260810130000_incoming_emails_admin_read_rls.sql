-- Migration: 20260810130000_incoming_emails_admin_read_rls.sql
-- Description: Grants admins read-all on incoming_emails so the dashboard
-- inbox can surface admin_only emails alongside buyer-facing ones.

DROP POLICY IF EXISTS "incoming_emails_admin_read" ON public.incoming_emails;
CREATE POLICY "incoming_emails_admin_read"
  ON public.incoming_emails
  FOR SELECT
  TO authenticated
  USING (is_admin());
