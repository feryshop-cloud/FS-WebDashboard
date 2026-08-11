-- Migration: 20260811130000_fix_unindexed_fkeys.sql
-- Description: Add covering indexes for every unindexed foreign key reported by
--   the Supabase performance advisor (lint: 0001_unindexed_foreign_keys).
--   Also drops unused indexes (lint: 0005_unused_index) that have never been
--   scanned.  All indexes are created with IF NOT EXISTS / dropped with IF EXISTS
--   so the migration is safe to re-run.
--
-- Tables and foreign keys addressed:
--   audit_logs              – user_id
--   balance_adjustments     – account_id, requested_by, approved_by
--   deals                   – admin_id, handled_by, stock_id
--   finance_ledger          – account_id, admin_id, created_by, deal_id,
--                             payment_id, stock_id
--   inventory               – added_by
--   orders                  – user_id
--   payments                – account_id, admin_id, deal_id, handled_by
--   problem_cases           – customer_id, handled_by
--   products                – category_id  (fk_products_product_category)
--   public_users            – role_id
--   role_permissions        – permission_id
--   stock_histories         – changed_by
--   stocks                  – admin_id, managed_by, payment_account_id
--   trade_in_items          – converted_to_stock_id
--   users                   – role_id
--
-- Unused indexes dropped:
--   idx_email_accounts_is_active             (email_accounts)
--   customers_name_idx                        (customers)
--   deals_customer_id_idx                     (deals)
--   inventory_game_id_idx                     (inventory)
--   inventory_title_reference_vector_hnsw_idx (inventory)
--   idx_rate_limit_attempts_email             (rate_limit_attempts)
--   inventory_search_vector_gin_idx           (inventory)

-- =====================================================================
-- 1. audit_logs
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs (user_id);

-- =====================================================================
-- 2. balance_adjustments
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_account_id
  ON public.balance_adjustments (account_id);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_requested_by
  ON public.balance_adjustments (requested_by);

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_approved_by
  ON public.balance_adjustments (approved_by);

-- =====================================================================
-- 3. deals
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_deals_admin_id
  ON public.deals (admin_id);

CREATE INDEX IF NOT EXISTS idx_deals_handled_by
  ON public.deals (handled_by);

CREATE INDEX IF NOT EXISTS idx_deals_stock_id
  ON public.deals (stock_id);

-- =====================================================================
-- 4. finance_ledger
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_finance_ledger_account_id
  ON public.finance_ledger (account_id);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_admin_id
  ON public.finance_ledger (admin_id);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_created_by
  ON public.finance_ledger (created_by);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_deal_id
  ON public.finance_ledger (deal_id);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_payment_id
  ON public.finance_ledger (payment_id);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_stock_id
  ON public.finance_ledger (stock_id);

-- =====================================================================
-- 5. inventory
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_added_by
  ON public.inventory (added_by);

-- =====================================================================
-- 6. orders
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders (user_id);

-- =====================================================================
-- 7. payments
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_payments_account_id
  ON public.payments (account_id);

CREATE INDEX IF NOT EXISTS idx_payments_admin_id
  ON public.payments (admin_id);

CREATE INDEX IF NOT EXISTS idx_payments_deal_id
  ON public.payments (deal_id);

CREATE INDEX IF NOT EXISTS idx_payments_handled_by
  ON public.payments (handled_by);

-- =====================================================================
-- 8. problem_cases
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_problem_cases_customer_id
  ON public.problem_cases (customer_id);

CREATE INDEX IF NOT EXISTS idx_problem_cases_handled_by
  ON public.problem_cases (handled_by);

-- =====================================================================
-- 9. products  (fk_products_product_category → category_id)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id);

-- =====================================================================
-- 10. public_users
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_public_users_role_id
  ON public.public_users (role_id);

-- =====================================================================
-- 11. role_permissions
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
  ON public.role_permissions (permission_id);

-- =====================================================================
-- 12. stock_histories
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stock_histories_changed_by
  ON public.stock_histories (changed_by);

-- =====================================================================
-- 13. stocks
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stocks_admin_id
  ON public.stocks (admin_id);

CREATE INDEX IF NOT EXISTS idx_stocks_managed_by
  ON public.stocks (managed_by);

CREATE INDEX IF NOT EXISTS idx_stocks_payment_account_id
  ON public.stocks (payment_account_id);

-- =====================================================================
-- 14. trade_in_items
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_trade_in_items_converted_to_stock_id
  ON public.trade_in_items (converted_to_stock_id);

-- =====================================================================
-- 15. users
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_role_id
  ON public.users (role_id);

-- =====================================================================
-- DROP unused indexes
-- =====================================================================
-- These indexes have never been used (pg_stat_user_indexes.idx_scan = 0)
-- and carry write-overhead with no query benefit.

DROP INDEX IF EXISTS public.idx_email_accounts_is_active;
DROP INDEX IF EXISTS public.customers_name_idx;
DROP INDEX IF EXISTS public.deals_customer_id_idx;
DROP INDEX IF EXISTS public.inventory_game_id_idx;
DROP INDEX IF EXISTS public.inventory_title_reference_vector_hnsw_idx;
DROP INDEX IF EXISTS public.idx_rate_limit_attempts_email;
DROP INDEX IF EXISTS public.inventory_search_vector_gin_idx;
