-- Add is_pin_enabled column to email_accounts for optional/manual PIN toggle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'is_pin_enabled'
  ) THEN
    ALTER TABLE public.email_accounts ADD COLUMN is_pin_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Update existing rows to have default 6-digit PIN if null and ensure is_pin_enabled is set
UPDATE public.email_accounts 
SET 
  access_pin = COALESCE(NULLIF(access_pin, ''), '123456'),
  is_pin_enabled = COALESCE(is_pin_enabled, true)
WHERE access_pin IS NULL OR access_pin = '' OR is_pin_enabled IS NULL;
