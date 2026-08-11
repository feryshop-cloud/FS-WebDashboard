-- Migration: 20260811200000_split_incoming_emails_policy.sql
-- Description: Split incoming_emails SELECT policy into buyer (anon/authenticated) and admin (authenticated only) to prevent anon executing is_admin().

DROP POLICY IF EXISTS "incoming_emails_read" ON public.incoming_emails;

CREATE POLICY "incoming_emails_buyer_read"
  ON public.incoming_emails FOR SELECT
  TO anon, authenticated
  USING (visibility = 'buyer');

CREATE POLICY "incoming_emails_admin_read"
  ON public.incoming_emails FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));
