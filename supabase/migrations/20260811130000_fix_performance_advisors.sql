-- Migration: 20260811130000_fix_performance_advisors.sql
-- Description: Resolve Supabase performance advisors.
--
-- Fixes applied:
--  1. auth_rls_initplan (games x3, users users_self_read, balance_adjustments
--     insert): wrap auth.uid() / admin checks in scalar initplan subqueries
--     `(select ...)` so they evaluate once per query instead of per row.
--     games admin policies rewrite the inline EXISTS to `(select is_admin())`.
--  2. multiple_permissive_policies (categories, incoming_emails, orders,
--     payment_methods, product_categories, products, settings, users):
--     collapse overlapping permissive policies for the same role+action into
--     a single policy. OR-ed permissive semantics are preserved exactly.

-- =====================================================================
-- 1. auth_rls_initplan
-- =====================================================================

-- games: replace inline EXISTS admin check with initplan is_admin()
DROP POLICY IF EXISTS "Allow admin insert" ON public.games;
CREATE POLICY "Allow admin insert"
  ON public.games FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Allow admin update" ON public.games;
CREATE POLICY "Allow admin update"
  ON public.games FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "Allow admin delete" ON public.games;
CREATE POLICY "Allow admin delete"
  ON public.games FOR DELETE TO authenticated
  USING ((select public.is_admin()));

-- users: self-read becomes an initplan (users_admin_read is consolidated
-- below in the users_read policy).
-- balance_adjustments: requester check becomes an initplan.
DROP POLICY IF EXISTS "balance_adjustments_insert" ON public.balance_adjustments;
CREATE POLICY "balance_adjustments_insert"
  ON public.balance_adjustments FOR INSERT TO authenticated
  WITH CHECK (requested_by = (select auth.uid()));

-- =====================================================================
-- 2. multiple_permissive_policies
-- =====================================================================

-- ------------------------------------------------------------------
-- categories
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin full access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read-only access on categories" ON public.categories;
DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;

CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_insert"
  ON public.categories FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "categories_admin_update"
  ON public.categories FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "categories_admin_delete"
  ON public.categories FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- incoming_emails
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to buyer emails" ON public.incoming_emails;
DROP POLICY IF EXISTS "incoming_emails_admin_read" ON public.incoming_emails;

CREATE POLICY "incoming_emails_read"
  ON public.incoming_emails FOR SELECT
  USING (visibility = 'buyer' OR (select public.is_admin()));

-- ------------------------------------------------------------------
-- orders
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read-only access on orders" ON public.orders;

CREATE POLICY "orders_read" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    (payment_status = 'pending' AND buy_status = 'pending')
    OR (select public.is_admin())
  );
CREATE POLICY "orders_update"
  ON public.orders FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "orders_delete"
  ON public.orders FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- payment_methods
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin full access on payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow public read-only access on payment_methods" ON public.payment_methods;

CREATE POLICY "payment_methods_read" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "payment_methods_insert"
  ON public.payment_methods FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "payment_methods_update"
  ON public.payment_methods FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "payment_methods_delete"
  ON public.payment_methods FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- product_categories
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "product_categories admin all" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories public read" ON public.product_categories;

CREATE POLICY "product_categories_read" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "product_categories_insert"
  ON public.product_categories FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "product_categories_update"
  ON public.product_categories FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "product_categories_delete"
  ON public.product_categories FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- products
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin full access on products" ON public.products;
DROP POLICY IF EXISTS "Allow public read-only access on products" ON public.products;

CREATE POLICY "products_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert"
  ON public.products FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "products_update"
  ON public.products FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "products_delete"
  ON public.products FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- settings
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_admin_access" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_delete" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_insert" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_update" ON public.settings;
DROP POLICY IF EXISTS "settings_authenticated_read" ON public.settings;
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;

CREATE POLICY "settings_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_insert"
  ON public.settings FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "settings_update"
  ON public.settings FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "settings_delete"
  ON public.settings FOR DELETE TO authenticated USING ((select public.is_admin()));

-- ------------------------------------------------------------------
-- users
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "users_admin_read" ON public.users;
DROP POLICY IF EXISTS "users_self_read" ON public.users;

CREATE POLICY "users_read"
  ON public.users FOR SELECT TO authenticated
  USING ((select auth.uid()) = id OR (select public.is_admin()));
