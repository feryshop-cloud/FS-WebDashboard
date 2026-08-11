-- Migration: 20260811140000_fix_missing_fk_indexes.sql
-- Description: Add the two foreign-key indexes that Supabase performance
-- advisors flag as genuinely missing (unindexed_foreign_keys).
--
-- Not touched: the `unused_index` findings. Every index the advisor flags is a
-- single-column FK-support index with no duplicate/overlap; the zero idx_scan
-- counts reflect a low-traffic database, not uselessness. Dropping FK indexes
-- would slow parent-table DELETE/UPDATE (FK checks) and any join/lookup on
-- those columns, so they are intentionally kept.

CREATE INDEX IF NOT EXISTS idx_deals_customer_id
  ON public.deals (customer_id);

CREATE INDEX IF NOT EXISTS idx_inventory_game_id
  ON public.inventory (game_id);
