-- =============================================================================
-- Migration: Rollback vector worker webhook trigger
-- Created: 2026-08-16
-- Updated: 2026-08-16
-- Purpose: Remove the generic webhook trigger and function
-- =============================================================================

-- Drop trigger first (required before dropping function)
DROP TRIGGER IF EXISTS inventory_vector_worker_webhook_trigger ON public.inventory;

-- Drop trigger function
DROP FUNCTION IF EXISTS supabase_functions.http_request();

-- Note: pg_net extension is intentionally kept
-- as it may be used by other database objects
