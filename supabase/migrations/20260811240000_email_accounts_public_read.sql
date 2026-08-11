-- Allow anon and authenticated users to read active email accounts for WebMail verification
DROP POLICY IF EXISTS "email_accounts_public_read" ON public.email_accounts;

CREATE POLICY "email_accounts_public_read"
  ON public.email_accounts FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
