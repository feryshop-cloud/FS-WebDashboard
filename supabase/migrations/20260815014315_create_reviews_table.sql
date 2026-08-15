-- Migration: 20260815014315_create_reviews_table.sql
-- Description: Tabel reviews storefront (ulasan produk) sesuai Drizzle schema FS-Public.
-- Kolom mengikuti definisi src/lib/db/schema.ts -> reviews.

CREATE TABLE IF NOT EXISTS public.reviews (
  id serial PRIMARY KEY,
  order_id varchar(100) REFERENCES public.orders(order_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  game_slug varchar(255),
  product_title varchar(255),
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_game_slug_idx ON public.reviews (game_slug);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_is_published_idx ON public.reviews (is_published);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Authenticated users can insert own review"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own review"
ON public.reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete own review"
ON public.reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow admin insert reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin update reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin delete reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Allow admin read all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (public.is_admin() OR is_published = true);
