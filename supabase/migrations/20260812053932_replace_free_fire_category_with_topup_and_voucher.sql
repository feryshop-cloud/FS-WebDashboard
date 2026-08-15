-- Migration: 20260812053932_replace_free_fire_category_with_topup_and_voucher.sql
-- Description: Ganti kategori lama "Free Fire" dengan "Top Up Game" + "Voucher Game"
-- untuk storefront. Aplikasikan idempotent agar aman di re-run / env baru.
-- State akhir (mencocokkan Supabase cloud):
--   categories: id1 "Top Up Game" (top-up-game), id2 "Voucher Game" (voucher-game)
--   games.category_id -> id "Top Up Game" (1)

DO $$
DECLARE
  topup_id integer;
  voucher_id integer;
BEGIN
  -- 1. Pastikan kategori "Top Up Game"
  INSERT INTO public.categories (title, game_slug, sort_order, is_active)
  VALUES ('Top Up Game', 'top-up-game', 0, true)
  ON CONFLICT DO NOTHING;
  SELECT id INTO topup_id FROM public.categories WHERE game_slug = 'top-up-game' LIMIT 1;
  IF topup_id IS NULL THEN
    UPDATE public.categories SET title = 'Top Up Game', game_slug = 'top-up-game', sort_order = 0, is_active = true
    WHERE id = (SELECT id FROM public.categories ORDER BY id LIMIT 1) RETURNING id INTO topup_id;
  END IF;

  -- 2. Pastikan kategori "Voucher Game"
  INSERT INTO public.categories (title, game_slug, sort_order, is_active)
  VALUES ('Voucher Game', 'voucher-game', 1, true)
  ON CONFLICT DO NOTHING;
  SELECT id INTO voucher_id FROM public.categories WHERE game_slug = 'voucher-game' LIMIT 1;
  IF voucher_id IS NULL THEN
    INSERT INTO public.categories (title, game_slug, sort_order, is_active)
    VALUES ('Voucher Game', 'voucher-game', 1, true)
    RETURNING id INTO voucher_id;
  END IF;

  -- 3. Semua game storefront mengarah ke "Top Up Game"
  UPDATE public.games SET category_id = topup_id;

  -- 4. Hapus kategori lama ber-slug free-fire (jika tersisa), lepaskan referensi produk dulu
  UPDATE public.products SET category_id = NULL
  WHERE category_id IN (SELECT id FROM public.categories WHERE game_slug IN ('free-fire', 'topup', 'topup-game'));
  DELETE FROM public.categories WHERE game_slug IN ('free-fire', 'topup', 'topup-game');
END $$;
