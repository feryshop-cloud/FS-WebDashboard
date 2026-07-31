-- Storefront remote configuration consumed by FS-Public.
--
-- This table intentionally lives in the shared Supabase project managed by
-- game-inventori because FS-Public reads public catalog/config data from the
-- same Supabase project. Keep public reads narrow: only SELECT is allowed for
-- anon/authenticated clients; writes remain service-role/dashboard owned.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION set_settings_updated_at();

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON settings;
CREATE POLICY "settings_public_read"
ON settings
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO settings (key, value, description)
VALUES
  ('site_name', '"Feryshop"', 'Nama situs'),
  ('site_title', '"Feryshop - Marketplace Akun Game Sultan & Top Up"', 'Judul default situs'),
  ('site_description', '"Platform marketplace akun game Sultan dan layanan top up game resmi termurah dan otomatis 24 jam di Indonesia."', 'Deskripsi default situs'),
  ('logo', '"/logo-2.png"', 'Logo fallback'),
  ('favicon', '"/favicon.ico"', 'Favicon'),
  ('footer_text', '"Made in Feryshop"', 'Teks footer'),
  ('social_facebook', '"https://facebook.com"', 'URL Facebook'),
  ('social_instagram', '"https://instagram.com"', 'URL Instagram'),
  ('social_whatsapp', '"https://wa.me/628123456789"', 'URL WhatsApp'),
  ('general.title', '"Feryshop"', 'Nama brand utama'),
  ('general.logo', '"/logo-2.png"', 'Logo utama'),
  ('seo.title', '"Feryshop - Marketplace Akun Game Sultan & Top Up"', 'SEO title'),
  ('seo.description', '"Platform Marketplace Akun Game Sultan & Layanan Top Up Game Resmi Termurah & Terpercaya 24 Jam."', 'SEO description'),
  ('footer.credit_text', '"Made in Feryshop"', 'Credit footer'),
  ('theme.default_mode', '"dark"', 'Mode tema default'),
  ('theme.allow_toggle', 'true', 'Izinkan toggle tema')
ON CONFLICT (key) DO NOTHING;
