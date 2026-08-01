-- Enable RLS across all public tables and open read access to non-sensitive
-- storefront data only.
--
-- Public (anon) can read:
--   - games (is_active only)      [already enabled in 0010]
--   - settings                    [already enabled]
--   - inventory (status=AVAILABLE, non-sensitive columns only)
--
-- authenticated (dashboard session) keeps full CRUD on operational tables and
-- read access on RBAC/identity tables (writes to those go through the
-- service-role client in create-admin-user.ts).
-- anon gets NO access to any admin table (RLS default-deny).

-- =====================================================================
-- settings: keep public read (settings_public_read exists), add auth CRUD
-- =====================================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_authenticated_all" ON public.settings;
CREATE POLICY "settings_authenticated_all"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================================
-- inventory: auth full CRUD + public read of AVAILABLE non-sensitive cols
-- =====================================================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_authenticated_all" ON public.inventory;
CREATE POLICY "inventory_authenticated_all"
ON public.inventory FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "inventory_public_select" ON public.inventory;
CREATE POLICY "inventory_public_select"
ON public.inventory FOR SELECT
TO anon
USING (status = 'AVAILABLE'::inventory_status);

-- Column-level security: anon may only see storefront columns, never
-- capital_price / sold_price / added_by / account internals.
REVOKE ALL ON TABLE public.inventory FROM anon;
GRANT SELECT (
  id,
  game_id,
  title_reference,
  account_specs,
  asking_price,
  status,
  image_urls,
  screenshot_url,
  created_at,
  updated_at,
  title_reference_vector
) ON public.inventory TO anon;

-- =====================================================================
-- RBAC / identity tables: authenticated read only (writes via service role)
-- =====================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_authenticated_read" ON public.roles;
CREATE POLICY "roles_authenticated_read"
ON public.roles FOR SELECT TO authenticated USING (true);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_authenticated_read" ON public.permissions;
CREATE POLICY "permissions_authenticated_read"
ON public.permissions FOR SELECT TO authenticated USING (true);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions_authenticated_read" ON public.role_permissions;
CREATE POLICY "role_permissions_authenticated_read"
ON public.role_permissions FOR SELECT TO authenticated USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_authenticated_read" ON public.users;
CREATE POLICY "users_authenticated_read"
ON public.users FOR SELECT TO authenticated USING (true);

ALTER TABLE public.public_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_users_authenticated_read" ON public.public_users;
CREATE POLICY "public_users_authenticated_read"
ON public.public_users FOR SELECT TO authenticated USING (true);

-- =====================================================================
-- Operational tables: authenticated full CRUD (dashboard writes via session)
-- =====================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_authenticated_all" ON public.accounts;
CREATE POLICY "accounts_authenticated_all"
ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stocks_authenticated_all" ON public.stocks;
CREATE POLICY "stocks_authenticated_all"
ON public.stocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deals_authenticated_all" ON public.deals;
CREATE POLICY "deals_authenticated_all"
ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_authenticated_all" ON public.payments;
CREATE POLICY "payments_authenticated_all"
ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.finance_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_ledger_authenticated_all" ON public.finance_ledger;
CREATE POLICY "finance_ledger_authenticated_all"
ON public.finance_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_authenticated_all" ON public.customers;
CREATE POLICY "customers_authenticated_all"
ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.deal_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deal_items_authenticated_all" ON public.deal_items;
CREATE POLICY "deal_items_authenticated_all"
ON public.deal_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.trade_in_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trade_in_items_authenticated_all" ON public.trade_in_items;
CREATE POLICY "trade_in_items_authenticated_all"
ON public.trade_in_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.problem_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "problem_cases_authenticated_all" ON public.problem_cases;
CREATE POLICY "problem_cases_authenticated_all"
ON public.problem_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.stock_histories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_histories_authenticated_all" ON public.stock_histories;
CREATE POLICY "stock_histories_authenticated_all"
ON public.stock_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_authenticated_all" ON public.audit_logs;
CREATE POLICY "audit_logs_authenticated_all"
ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
