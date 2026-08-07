-- 0043: RPC sync_digiflazz_products (batch upsert) utk worker Cron Digiflazz
-- Pemilik skema: game-inventori. Worker memanggil RPC ini SATU kali per cron (bukan N REST POST).

CREATE OR REPLACE FUNCTION public.sync_digiflazz_products(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item  jsonb;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'array' THEN
    RAISE EXCEPTION 'payload must be a JSON array';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(payload) LOOP
    INSERT INTO public.products (
      id, title, selling_price, selling_price_gold, selling_price_platinum,
      game_slug, category_id, description, start_cut_off, end_cut_off,
      is_active, sku, provider, provider_ref, last_synced_at
    )
    VALUES (
      item->>'id',
      item->>'title',
      COALESCE(NULLIF((item->>'selling_price')::text, ''), '0')::numeric,
      COALESCE(NULLIF((item->>'selling_price_gold')::text, ''), (item->>'selling_price')::text)::numeric,
      COALESCE(NULLIF((item->>'selling_price_platinum')::text, ''), (item->>'selling_price')::text)::numeric,
      NULLIF(item->>'game_slug', ''),
      NULLIF(item->>'category_id', '')::int,
      item->>'description',
      NULLIF(item->>'start_cut_off', ''),
      NULLIF(item->>'end_cut_off', ''),
      COALESCE((item->>'is_active')::boolean, true),
      COALESCE(NULLIF(item->>'sku', ''), item->>'id'),
      COALESCE(NULLIF(item->>'provider', ''), 'digiflazz'),
      NULLIF(item->>'provider_ref', ''),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      title                    = EXCLUDED.title,
      selling_price            = EXCLUDED.selling_price,
      selling_price_gold       = EXCLUDED.selling_price_gold,
      selling_price_platinum   = EXCLUDED.selling_price_platinum,
      game_slug                = EXCLUDED.game_slug,
      category_id              = EXCLUDED.category_id,
      description              = EXCLUDED.description,
      start_cut_off            = EXCLUDED.start_cut_off,
      end_cut_off              = EXCLUDED.end_cut_off,
      is_active                = EXCLUDED.is_active,
      sku                      = EXCLUDED.sku,
      provider                 = EXCLUDED.provider,
      provider_ref             = EXCLUDED.provider_ref,
      last_synced_at           = now();
  END LOOP;
END $$;

-- Batasi akses: hanya service_role (worker pakai service role key)
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.sync_digiflazz_products(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_digiflazz_products(jsonb) TO service_role;