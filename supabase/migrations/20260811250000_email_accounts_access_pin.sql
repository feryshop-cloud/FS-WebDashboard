-- Add access_pin column to email_accounts for mailbox authentication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'access_pin'
  ) THEN
    ALTER TABLE public.email_accounts ADD COLUMN access_pin VARCHAR(20) DEFAULT '123456';
  END IF;
END $$;

-- Update existing rows to have default 6-digit PIN if null
UPDATE public.email_accounts 
SET access_pin = '123456' 
WHERE access_pin IS NULL OR access_pin = '';
