-- Migration: 0024_categories_rls_authenticated_crud.sql
-- Description: Ensure public.categories has RLS enabled with authenticated CRUD and public SELECT access.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public (anon + authenticated) to read active categories or all categories for storefront/dashboard
DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select"
ON public.categories FOR SELECT
USING (true);

-- Allow authenticated users (dashboard session) full CRUD (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "categories_authenticated_all" ON public.categories;
CREATE POLICY "categories_authenticated_all"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant privileges
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq TO authenticated;
