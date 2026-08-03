-- ============================================================================
-- SEED DATA CATALOG & PRODUCTS UNTUK SUPABASE DATABASE (FERYSHOP)
-- SQL script ini mengisi data game dan daftar item topup lengkap & realistis
-- ============================================================================

-- 1. SEED GAMES CATALOG (public.games)
-- Note: 'title' dan 'image' di public.games adalah column GENERATED (GENERATED ALWAYS AS (name) / (image_url))
-- Sehingga tidak dimasukkan secara manual ke dalam INSERT column list.
INSERT INTO public.games (id, name, slug, image_url, banner, logo, developers, description, is_popular, is_active, sort_order)
VALUES
  ('70f6e520-a6ff-48ee-a34f-ebbc14400eef', 'Mobile Legends', 'mobile-legends', '/api/storage/games/logo/mlbb-icon.webp', '/api/storage/games/banner/mlbb-banner.webp', '/api/storage/games/logo/mlbb-icon.webp', 'Moonton', 'Top up Diamond Mobile Legends resmi 100% legal, murah, dan instan 24 jam.', true, true, 1),
  ('12a76f10-b98a-4c22-92a1-ef9871bb0102', 'Free Fire', 'free-fire', '/api/storage/games/logo/ff-icon.webp', '/api/storage/games/banner/ff-banner.webp', '/api/storage/games/logo/ff-icon.webp', 'Garena', 'Top up Diamond Free Fire Garena termurah dan tercepat.', true, true, 2),
  ('47a40734-b5da-49e8-80d2-a5878ef7f09d', 'PUBG Mobile', 'pubg-mobile', '/api/storage/games/logo/pubg-icon.webp', '/api/storage/games/banner/pubg-banner.webp', '/api/storage/games/logo/pubg-icon.webp', 'Tencent Games', 'Top up UC PUBG Mobile legal resmi aman dengan proses otomatis.', true, true, 3),
  ('8d0aa1e1-0170-43ae-911f-4e5e9eec3a17', 'Valorant', 'valorant', '/api/storage/games/logo/valorant-icon.webp', '/api/storage/games/banner/valorant-banner.webp', '/api/storage/games/logo/valorant-icon.webp', 'Riot Games', 'Beli Valorant Points (VP) resmi Riot Games cepat & murah.', true, true, 4),
  ('dec39e22-a8d4-4f38-89c2-e0ec3edd61c4', 'Genshin Impact', 'genshin-impact', '/api/storage/games/image/genshin-icon.webp', '/api/storage/games/banner/genshin-banner.webp', '/api/storage/games/image/genshin-icon.webp', 'HoYoverse', 'Top up Genesis Crystals & Blessing of the Welkin Moon Genshin Impact resmi.', true, true, 5),
  ('5582345d-6480-4fd4-939c-aeabf4187198', 'Roblox', 'roblox', '/api/storage/games/logo/roblox-icon.webp', '/api/storage/games/banner/roblox-banner.webp', '/api/storage/games/logo/roblox-icon.webp', 'Roblox Corporation', 'Top up Robux resmi cepat dan murah untuk akun Roblox kamu.', true, true, 6),
  ('6673111e-2234-4aab-8812-bb9019283741', 'Honor of Kings', 'honor-of-kings', '/api/storage/games/logo/hok-icon.webp', '/api/storage/games/banner/hok-banner.webp', '/api/storage/games/logo/hok-icon.webp', 'Level Infinite', 'Top up Tokens & Weekly Card Honor of Kings murah dan cepat.', true, true, 7),
  ('881234ef-5678-4321-90ab-cdef12345678', 'Call of Duty Mobile', 'call-of-duty-mobile', '/api/storage/games/logo/codm-icon.webp', '/api/storage/games/banner/codm-banner.webp', '/api/storage/games/logo/codm-icon.webp', 'Garena', 'Top up CP Call of Duty Mobile resmi dan terpercaya.', false, true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  developers = EXCLUDED.developers,
  is_active = true;

-- 2. SEED PRODUCTS (public.products)
INSERT INTO public.products (id, game_slug, title, selling_price, selling_price_gold, selling_price_platinum, cost_price, sku, is_active, is_gangguan)
VALUES
  -- MOBILE LEGENDS
  ('ML-86', 'mobile-legends', '86 Diamonds (78 + 8 Bonus)', 20000, 19500, 19000, 17500, 'ML-86', true, false),
  ('ML-172', 'mobile-legends', '172 Diamonds (156 + 16 Bonus)', 40000, 39000, 38000, 35000, 'ML-172', true, false),
  ('ML-257', 'mobile-legends', '257 Diamonds (234 + 23 Bonus)', 60000, 58500, 57000, 53000, 'ML-257', true, false),
  ('ML-344', 'mobile-legends', '344 Diamonds (312 + 32 Bonus)', 80000, 78000, 76000, 70000, 'ML-344', true, false),
  ('ML-706', 'mobile-legends', '706 Diamonds (625 + 81 Bonus)', 165000, 162000, 159000, 148000, 'ML-706', true, false),
  ('ML-1412', 'mobile-legends', '1412 Diamonds (1250 + 162 Bonus)', 330000, 324000, 318000, 295000, 'ML-1412', true, false),
  ('ML-WDP', 'mobile-legends', 'Weekly Diamond Pass (WDP)', 28000, 27500, 27000, 25000, 'ML-WDP', true, false),
  ('ML-TWILIGHT', 'mobile-legends', 'Twilight Pass', 145000, 142000, 139000, 130000, 'ML-TWILIGHT', true, false),

  -- FREE FIRE
  ('FF-5', 'free-fire', '5 Diamonds', 1500, 1400, 1300, 1000, 'FF-5', true, false),
  ('FF-12', 'free-fire', '12 Diamonds', 2500, 2400, 2300, 1800, 'FF-12', true, false),
  ('FF-50', 'free-fire', '50 Diamonds', 8000, 7800, 7500, 6800, 'FF-50', true, false),
  ('FF-70', 'free-fire', '70 Diamonds', 10000, 9800, 9500, 8500, 'FF-70', true, false),
  ('FF-140', 'free-fire', '140 Diamonds', 19500, 19000, 18500, 16800, 'FF-140', true, false),
  ('FF-355', 'free-fire', '355 Diamonds', 48500, 47500, 46500, 42000, 'FF-355', true, false),
  ('FF-720', 'free-fire', '720 Diamonds', 96500, 95000, 93500, 84000, 'FF-720', true, false),
  ('FF-1440', 'free-fire', '1440 Diamonds', 192000, 189000, 186000, 168000, 'FF-1440', true, false),
  ('FF-WM', 'free-fire', 'Membership Mingguan (Weekly)', 33000, 32000, 31000, 28000, 'FF-WM', true, false),
  ('FF-MM', 'free-fire', 'Membership Bulanan (Monthly)', 165000, 161000, 157000, 142000, 'FF-MM', true, false),

  -- PUBG MOBILE
  ('PUBG-60', 'pubg-mobile', '60 UC', 15000, 14700, 14400, 13000, 'PUBG-60', true, false),
  ('PUBG-325', 'pubg-mobile', '325 UC (300 + 25 Bonus)', 74500, 73000, 71500, 65000, 'PUBG-325', true, false),
  ('PUBG-660', 'pubg-mobile', '660 UC (600 + 60 Bonus)', 149000, 146000, 143000, 130000, 'PUBG-660', true, false),
  ('PUBG-1800', 'pubg-mobile', '1800 UC (1500 + 300 Bonus)', 399000, 392000, 385000, 350000, 'PUBG-1800', true, false),
  ('PUBG-3850', 'pubg-mobile', '3850 UC (3000 + 850 Bonus)', 799000, 785000, 770000, 700000, 'PUBG-3850', true, false),

  -- VALORANT
  ('VAL-300', 'valorant', '300 Valorant Points', 40000, 39000, 38000, 34000, 'VAL-300', true, false),
  ('VAL-625', 'valorant', '625 Valorant Points', 80000, 78000, 76000, 68000, 'VAL-625', true, false),
  ('VAL-1125', 'valorant', '1125 Valorant Points', 140000, 137000, 134000, 120000, 'VAL-1125', true, false),
  ('VAL-1650', 'valorant', '1650 Valorant Points', 200000, 196000, 192000, 175000, 'VAL-1650', true, false),
  ('VAL-2400', 'valorant', '2400 Valorant Points', 280000, 274000, 268000, 245000, 'VAL-2400', true, false),
  ('VAL-5800', 'valorant', '5800 Valorant Points', 650000, 637000, 624000, 570000, 'VAL-5800', true, false),

  -- GENSHIN IMPACT
  ('GI-60', 'genshin-impact', '60 Genesis Crystals', 16000, 15500, 15000, 13500, 'GI-60', true, false),
  ('GI-330', 'genshin-impact', '330 Genesis Crystals (300 + 30 Bonus)', 79000, 77000, 75000, 68000, 'GI-330', true, false),
  ('GI-1090', 'genshin-impact', '1090 Genesis Crystals (980 + 110 Bonus)', 249000, 244000, 239000, 215000, 'GI-1090', true, false),
  ('GI-2240', 'genshin-impact', '2240 Genesis Crystals (1980 + 260 Bonus)', 479000, 469000, 459000, 415000, 'GI-2240', true, false),
  ('GI-3880', 'genshin-impact', '3880 Genesis Crystals (3280 + 600 Bonus)', 799000, 783000, 767000, 695000, 'GI-3880', true, false),
  ('GI-8080', 'genshin-impact', '8080 Genesis Crystals (6480 + 1600 Bonus)', 1599000, 1567000, 1535000, 1390000, 'GI-8080', true, false),
  ('GI-WELKIN', 'genshin-impact', 'Blessing of the Welkin Moon', 79000, 77000, 75000, 68000, 'GI-WELKIN', true, false),

  -- ROBLOX
  ('RBX-80', 'roblox', '80 Robux', 16000, 15500, 15000, 13500, 'RBX-80', true, false),
  ('RBX-400', 'roblox', '400 Robux', 75000, 73000, 71000, 64000, 'RBX-400', true, false),
  ('RBX-800', 'roblox', '800 Robux', 150000, 146000, 142000, 128000, 'RBX-800', true, false),
  ('RBX-1700', 'roblox', '1700 Robux', 310000, 302000, 294000, 265000, 'RBX-1700', true, false),
  ('RBX-4500', 'roblox', '4500 Robux', 790000, 770000, 750000, 680000, 'RBX-4500', true, false),
  ('RBX-10000', 'roblox', '10000 Robux', 1690000, 1650000, 1610000, 1450000, 'RBX-10000', true, false),

  -- HONOR OF KINGS
  ('HOK-80', 'honor-of-kings', '80 Tokens', 16000, 15500, 15000, 13500, 'HOK-80', true, false),
  ('HOK-240', 'honor-of-kings', '240 Tokens', 48000, 46800, 45600, 41000, 'HOK-240', true, false),
  ('HOK-400', 'honor-of-kings', '400 Tokens', 79000, 77000, 75000, 67000, 'HOK-400', true, false),
  ('HOK-800', 'honor-of-kings', '800 Tokens', 158000, 154000, 150000, 135000, 'HOK-800', true, false),
  ('HOK-WEEKLY', 'honor-of-kings', 'Weekly Card', 16000, 15500, 15000, 13500, 'HOK-WEEKLY', true, false),
  ('HOK-WEEKLY-PLUS', 'honor-of-kings', 'Weekly Card Plus', 48000, 46800, 45600, 41000, 'HOK-WEEKLY-PLUS', true, false),

  -- CALL OF DUTY MOBILE
  ('CODM-31', 'call-of-duty-mobile', '31 CP', 5000, 4800, 4600, 4000, 'CODM-31', true, false),
  ('CODM-62', 'call-of-duty-mobile', '62 CP', 10000, 9700, 9400, 8200, 'CODM-62', true, false),
  ('CODM-127', 'call-of-duty-mobile', '127 CP', 20000, 19500, 19000, 16500, 'CODM-127', true, false),
  ('CODM-320', 'call-of-duty-mobile', '320 CP', 50000, 48800, 47600, 42000, 'CODM-320', true, false),
  ('CODM-645', 'call-of-duty-mobile', '645 CP', 100000, 97500, 95000, 84000, 'CODM-645', true, false)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  selling_price = EXCLUDED.selling_price,
  selling_price_gold = EXCLUDED.selling_price_gold,
  selling_price_platinum = EXCLUDED.selling_price_platinum,
  cost_price = EXCLUDED.cost_price,
  is_active = true;
