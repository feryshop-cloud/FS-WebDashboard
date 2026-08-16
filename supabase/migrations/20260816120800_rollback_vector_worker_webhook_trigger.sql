-- =============================================================================
-- Migration: Rollback vector worker webhook trigger
-- Created: 2026-08-16
-- Purpose: Remove the webhook trigger and function from inventory table
-- =============================================================================

-- Drop trigger first (required before dropping function)
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.send_vector_worker_webhook();

-- Note: pgcrypto and pg_net extensions are intentionally kept
-- as they may be used by other database objects
