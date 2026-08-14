-- Dashboard-controllable texts & contact for FS-Public marketplace account detail view.
-- Keys live under the `marketplace.` prefix; SiteSettingsTab groups them together.

INSERT INTO settings (key, value, description)
VALUES
  ('marketplace.brand_name', '"Feryshop"', 'Nama brand pada pesan WhatsApp Rekber'),
  ('marketplace.admin_whatsapp', '"6281234567890"', 'Nomor WhatsApp admin Rekber (format internasional tanpa +)'),
  ('marketplace.anti_hack_badge', '"100% Anti-Hack & All Monsep"', 'Badge garansi anti-hack pada gambar akun'),
  ('marketplace.price_label', '"Harga Pas Rekber"', 'Label harga pada kartu pembelian'),
  ('marketplace.buy_button_text', '"Beli via Rekber WhatsApp"', 'Teks tombol beli via Rekber'),
  ('marketplace.ask_button_text', '"Tanya Stok & Detail"', 'Teks tombol tanya stok'),
  ('marketplace.security_title', '"Transaksi 100% Aman via Rekber Feryshop"', 'Judul jaminan keamanan transaksi'),
  ('marketplace.security_subtitle', '"Garansi Penggantian / Anti-Hack"', 'Subjudul jaminan keamanan transaksi'),
  ('marketplace.seller_info_label', '"Informasi Penjual"', 'Label box informasi penjual'),
  ('marketplace.specs_title', '"Spesifikasi Akun Utama"', 'Judul bagian spesifikasi akun'),
  ('marketplace.description_title', '"Detail Deskripsi & Kelengkapan"', 'Judul bagian deskripsi akun'),
  ('marketplace.listed_label', '"Diposting"', 'Label waktu posting akun'),
  ('marketplace.discount_label', '"Diskon"', 'Label badge diskon')
ON CONFLICT (key) DO NOTHING;
