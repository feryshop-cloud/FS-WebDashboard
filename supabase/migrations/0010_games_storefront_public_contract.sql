-- Complete the public storefront contract for games without replacing the
-- existing admin-owned `name`, `slug`, and `image_url` source columns.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS title TEXT GENERATED ALWAYS AS (name) STORED,
  ADD COLUMN IF NOT EXISTS image TEXT GENERATED ALWAYS AS (image_url) STORED,
  ADD COLUMN IF NOT EXISTS banner TEXT,
  ADD COLUMN IF NOT EXISTS logo TEXT,
  ADD COLUMN IF NOT EXISTS developers TEXT NOT NULL DEFAULT 'Game Developer',
  ADD COLUMN IF NOT EXISTS category_id INTEGER NOT NULL DEFAULT 99,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS instructions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 999;

UPDATE public.games
SET
  image_url = COALESCE(NULLIF(image_url, ''), '/placeholder.png'),
  banner = COALESCE(NULLIF(banner, ''), NULLIF(image_url, ''), '/placeholder.png'),
  logo = COALESCE(NULLIF(logo, ''), '/logo-topup.webp'),
  developers = CASE slug
    WHEN 'mobile-legends' THEN 'Moonton'
    WHEN 'free-fire' THEN 'Garena'
    WHEN 'pubg-mobile' THEN 'Tencent / Level Infinite'
    WHEN 'valorant' THEN 'Riot Games'
    WHEN 'genshin-impact' THEN 'HoYoverse'
    WHEN 'roblox' THEN 'Roblox Corporation'
    ELSE COALESCE(NULLIF(developers, ''), 'Game Developer')
  END,
  category_id = CASE slug
    WHEN 'mobile-legends' THEN 1
    WHEN 'free-fire' THEN 1
    WHEN 'pubg-mobile' THEN 1
    WHEN 'genshin-impact' THEN 1
    WHEN 'roblox' THEN 1
    WHEN 'valorant' THEN 2
    ELSE 99
  END,
  description = COALESCE(NULLIF(description, ''), CASE slug
    WHEN 'mobile-legends' THEN 'Top up Diamond Mobile Legends resmi, cepat, dan mudah diproses melalui Feryshop.'
    WHEN 'free-fire' THEN 'Top up Diamond Free Fire dengan proses praktis dan pilihan pembayaran lengkap.'
    WHEN 'pubg-mobile' THEN 'Top up UC PUBG Mobile aman untuk kebutuhan Royale Pass, crate, dan item favorit.'
    WHEN 'valorant' THEN 'Beli Valorant Points untuk skin, battle pass, dan bundle eksklusif Riot Games.'
    WHEN 'genshin-impact' THEN 'Top up Genesis Crystal Genshin Impact untuk wish, bundle, dan kebutuhan akun.'
    WHEN 'roblox' THEN 'Top up Robux dan kebutuhan Roblox dengan proses pembayaran yang mudah.'
    ELSE 'Layanan game dan produk digital tersedia di Feryshop.'
  END),
  instructions = CASE
    WHEN instructions <> '{}'::jsonb THEN instructions
    WHEN slug = 'mobile-legends' THEN '{"title":"Cara Top Up Mobile Legends","steps":["Masukkan User ID dan Zone ID","Pilih nominal Diamond","Pilih metode pembayaran","Selesaikan pembayaran"],"fields":[{"name":"id","label":"User ID","type":"text","required":true},{"name":"server","label":"Zone ID","type":"text","required":true}]}'::jsonb
    WHEN slug = 'valorant' THEN '{"title":"Cara Top Up Valorant","steps":["Masukkan Riot ID","Pilih nominal Valorant Points","Pilih metode pembayaran","Selesaikan pembayaran"],"fields":[{"name":"id","label":"Riot ID","type":"text","required":true}]}'::jsonb
    ELSE '{"title":"Cara Order","steps":["Masukkan data akun","Pilih produk","Pilih metode pembayaran","Selesaikan pembayaran"],"fields":[{"name":"id","label":"ID Akun","type":"text","required":true}]}'::jsonb
  END,
  is_popular = CASE slug
    WHEN 'mobile-legends' THEN TRUE
    WHEN 'free-fire' THEN TRUE
    WHEN 'pubg-mobile' THEN TRUE
    WHEN 'valorant' THEN TRUE
    ELSE is_popular
  END,
  sort_order = CASE slug
    WHEN 'mobile-legends' THEN 1
    WHEN 'free-fire' THEN 2
    WHEN 'pubg-mobile' THEN 3
    WHEN 'valorant' THEN 4
    WHEN 'genshin-impact' THEN 5
    WHEN 'roblox' THEN 6
    ELSE 99
  END
WHERE TRUE;

CREATE INDEX IF NOT EXISTS games_is_active_sort_order_idx
ON public.games (is_active, sort_order, name);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read games" ON public.games;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.games;

CREATE POLICY "Public can read games"
ON public.games FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);
