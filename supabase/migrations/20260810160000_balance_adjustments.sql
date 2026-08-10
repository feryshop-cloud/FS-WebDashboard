-- Migration: Create balance_adjustments table and is_owner helper function

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND r.name = 'OWNER'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- Create adjustment status enum
DO $$ BEGIN
  CREATE TYPE adjustment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create balance_adjustments table
CREATE TABLE IF NOT EXISTS balance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT NOT NULL,
  status adjustment_status DEFAULT 'PENDING' NOT NULL,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Select policy: all authenticated users can view adjustments
DROP POLICY IF EXISTS "balance_adjustments_select" ON balance_adjustments;
CREATE POLICY "balance_adjustments_select"
  ON balance_adjustments FOR SELECT TO authenticated
  USING (true);

-- Insert policy: any authenticated user can request an adjustment
DROP POLICY IF EXISTS "balance_adjustments_insert" ON balance_adjustments;
CREATE POLICY "balance_adjustments_insert"
  ON balance_adjustments FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update policy: owners or admins can approve/reject
DROP POLICY IF EXISTS "balance_adjustments_update" ON balance_adjustments;
CREATE POLICY "balance_adjustments_update"
  ON balance_adjustments FOR UPDATE TO authenticated
  USING (is_admin() OR is_owner())
  WITH CHECK (is_admin() OR is_owner());

-- Delete policy: owners or admins can delete
DROP POLICY IF EXISTS "balance_adjustments_delete" ON balance_adjustments;
CREATE POLICY "balance_adjustments_delete"
  ON balance_adjustments FOR DELETE TO authenticated
  USING (is_admin() OR is_owner());
