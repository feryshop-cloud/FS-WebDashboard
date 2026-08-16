-- =============================================================================
-- Migration: Create create_inventory_vector RPC
-- Created: 2026-08-16
-- Purpose: Create RPC function for vectorizing a single inventory record
--          Required by vector-worker to process webhook queue messages
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_inventory_vector(p_record_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.inventory
  SET title_reference_vector = public.inventory_title_vector(
    COALESCE(title_reference, '') || ' ' || COALESCE(account_specs, '')
  )
  WHERE id = p_record_id
    AND (title_reference IS NOT NULL AND btrim(title_reference) <> ''
         OR account_specs IS NOT NULL AND btrim(account_specs) <> '');
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;
