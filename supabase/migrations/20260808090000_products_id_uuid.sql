-- 0046: Refactor products.id -> generated uuid (bukan SKU).
--
-- Latar: products.id sebelumnya varchar(100) = buyer_sku_code Digiflazz.
--        Skema uuid index btree 16-byte lebih ringan & terjaga saat produk diganti
--        provider; SKU dipindah ke kolom tersendiri (unique).
-- Effect:
--   * products.id: uuid, default gen_random_uuid() (DB generate).
--   * products.sku: index unique parsial (NULL diizinkan utk produk manual).
--   * orders.product_id: di-remap value SKU lama -> uuid products.id (slide by-value),
--     kolom ikut jadi uuid agar join storefront (products.id = orders.product_id) utuh.
--   * sync_digiflazz_products: INSERT tanpa id (DB default), upsert key pindah ke sku.

BEGIN;

-- 1) Backfill sku utk produk yg sku-nya kosong (produk manual) dari id lama.
UPDATE public.products
SET sku = id
WHERE sku IS NULL OR sku = '';

-- 2) Unique index parsial sku (produk manual boleh sku duplikat NULL).
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key
    ON public.products (sku)
    WHERE sku IS NOT NULL;

-- 3) Kolom id uuid temporer + isi.
ALTER TABLE public.products ADD COLUMN new_id uuid;
UPDATE public.products SET new_id = gen_random_uuid();
ALTER TABLE public.products ALTER COLUMN new_id SET NOT NULL;

-- 4) Remap orders.product_id lama (SKU) -> uuid baru.
ALTER TABLE public.orders ADD COLUMN product_id_uuid uuid;
UPDATE public.orders o
SET product_id_uuid = p.new_id
FROM public.products p
WHERE o.product_id::text = p.id::text;
ALTER TABLE public.orders DROP COLUMN product_id;
ALTER TABLE public.orders RENAME COLUMN product_id_uuid TO product_id;
ALTER TABLE public.orders ALTER COLUMN product_id SET NOT NULL;

-- 5) Ganti PK products: drop id lama -> rename new_id -> id.
ALTER TABLE public.products DROP CONSTRAINT products_pkey;
ALTER TABLE public.products DROP COLUMN id;
ALTER TABLE public.products RENAME COLUMN new_id TO id;
ALTER TABLE public.products ADD PRIMARY KEY (id);
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 6) Recreate sync RPC: DB generate id, upsert ON CONFLICT (sku).
CREATE OR REPLACE FUNCTION public.sync_digiflazz_products(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item  jsonb;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'array' THEN
    RAISE EXCEPTION 'payload must be a JSON array';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(payload) LOOP
    INSERT INTO public.products (
      title, selling_price, selling_price_gold, selling_price_platinum,
      game_slug, brand, category_id, description, start_cut_off, end_cut_off,
      is_active, sku, provider, provider_ref, last_synced_at
    )
    VALUES (
      item->>'title',
      COALESCE(NULLIF((item->>'selling_price')::text, ''), '0')::numeric,
      COALESCE(NULLIF((item->>'selling_price_gold')::text, ''), (item->>'selling_price')::text)::numeric,
      COALESCE(NULLIF((item->>'selling_price_platinum')::text, ''), (item->>'selling_price')::text)::numeric,
      NULLIF(item->>'game_slug', ''),
      NULLIF(item->>'brand', ''),
      NULLIF(item->>'category_id', '')::int,
      item->>'description',
      NULLIF(item->>'start_cut_off', ''),
      NULLIF(item->>'end_cut_off', ''),
      COALESCE((item->>'is_active')::boolean, true),
      NULLIF(item->>'sku', ''),
      COALESCE(NULLIF(item->>'provider', ''), 'digiflazz'),
      NULLIF(item->>'provider_ref', ''),
      now()
    )
    ON CONFLICT (sku) WHERE sku IS NOT NULL DO UPDATE SET
      title                  = EXCLUDED.title,
      selling_price          = EXCLUDED.selling_price,
      selling_price_gold     = EXCLUDED.selling_price_gold,
      selling_price_platinum = EXCLUDED.selling_price_platinum,
      game_slug              = EXCLUDED.game_slug,
      brand                  = EXCLUDED.brand,
      category_id            = EXCLUDED.category_id,
      description            = EXCLUDED.description,
      start_cut_off          = EXCLUDED.start_cut_off,
      end_cut_off            = EXCLUDED.end_cut_off,
      is_active              = EXCLUDED.is_active,
      sku                    = EXCLUDED.sku,
      provider               = EXCLUDED.provider,
      provider_ref           = EXCLUDED.provider_ref,
      last_synced_at         = now();
  END LOOP;
END $function$;

-- Batasi akses: hanya service_role (worker pakai service role key)
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_digiflazz_products(jsonb) TO service_role;

COMMIT;