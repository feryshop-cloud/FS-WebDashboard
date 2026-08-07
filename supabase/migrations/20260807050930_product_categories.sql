-- 0042: Tabel product_categories + relasi FK products + kolom sinkronisasi Digiflazz
-- Pemilik skema: game-inventori (multi-repo). Jangan dijalankan di repo lain.

-- =============================================================
-- 0. Seed & remap kategori (SEBELUM re-attach FK) -- mititigasi P2
--    Salin kategori existing (categories) ke product_categories,
--    lalu re-arahkan produk lama. Produk tanpa kategori dibiarkan NULL.
-- =============================================================

-- 1. Tabel product_categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id         serial PRIMARY KEY,
  title      varchar(100) NOT NULL,
  slug       varchar(100) UNIQUE,
  sort_order integer DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL
);

-- 2. Seed dari categories existing (pertahankan mapping lama)
INSERT INTO public.product_categories (title, slug, sort_order)
SELECT c.title, lower(replace(c.title, ' ', '-')), row_number() OVER (ORDER BY c.id)
FROM public.categories c
ON CONFLICT (slug) DO NOTHING;

-- 3. Re-map products.category_id → product_categories.id (via title)
UPDATE public.products p
SET category_id = pc.id
FROM public.product_categories pc
JOIN public.categories c ON c.title = pc.title
WHERE p.category_id = c.id;

-- 4. Drop FK lama ke categories
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- 5. Attach FK ke product_categories (ON DELETE SET NULL = detach)
ALTER TABLE public.products
  ADD CONSTRAINT fk_products_product_category
  FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- =============================================================
-- 6. Kolom baru untuk sinkronisasi + tampilan
-- =============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS start_cut_off  varchar(5),
  ADD COLUMN IF NOT EXISTS end_cut_off    varchar(5),
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS provider       varchar(50) DEFAULT 'digiflazz',
  ADD COLUMN IF NOT EXISTS provider_ref   varchar(255);

-- =============================================================
-- 7. RLS product_categories: public read, admin full
-- =============================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'product_categories public read') THEN
    CREATE POLICY "product_categories public read"
      ON public.product_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'product_categories admin all') THEN
    CREATE POLICY "product_categories admin all"
      ON public.product_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;