-- Align the live MVP schema with the tables and compatibility columns used by
-- the current Next.js application code. This migration is additive and keeps
-- the existing stocks/deals/payments/ledger data model intact.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_status') THEN
    CREATE TYPE inventory_status AS ENUM ('UNPOSTED', 'AVAILABLE', 'SOLD');
  END IF;
END $$;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, role_id, full_name, email, status, created_at, updated_at)
SELECT
  public_users.id,
  public_users.role_id,
  public_users.full_name,
  COALESCE(auth.users.email, public_users.id::TEXT || '@local.invalid'),
  CASE WHEN public_users.is_active THEN 'Aktif' ELSE 'Nonaktif' END,
  public_users.created_at,
  public_users.updated_at
FROM public_users
LEFT JOIN auth.users ON auth.users.id = public_users.id
ON CONFLICT (id) DO UPDATE SET
  role_id = EXCLUDED.role_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO games (name, slug)
SELECT DISTINCT
  category,
  lower(regexp_replace(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
FROM stocks
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS account_detail TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS login_info TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS password_info TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE stocks
SET
  sku = COALESCE(sku, 'STK-' || left(id::TEXT, 8)),
  account_detail = COALESCE(account_detail, account_details),
  login_info = COALESCE(login_info, username),
  password_info = COALESCE(password_info, password),
  notes = COALESCE(notes, internal_notes),
  managed_by = COALESCE(managed_by, admin_id)
WHERE sku IS NULL
   OR account_detail IS NULL
   OR login_info IS NULL
   OR password_info IS NULL
   OR notes IS NULL
   OR managed_by IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stocks_sku_unique ON stocks (sku);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'BANK';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_type VARCHAR(50) NOT NULL DEFAULT 'Penjualan' CHECK (deal_type IN ('Penjualan', 'Tukar Tambah'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS total_deal_price NUMERIC(15, 2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE deals
SET
  total_deal_price = COALESCE(total_deal_price, deal_price),
  handled_by = COALESCE(handled_by, admin_id)
WHERE total_deal_price IS NULL OR handled_by IS NULL;

ALTER TABLE deals ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN deal_price SET DEFAULT 0;
ALTER TABLE deals ALTER COLUMN remaining_balance SET DEFAULT 0;
ALTER TABLE deals ALTER COLUMN total_deal_price SET DEFAULT 0;

CREATE TABLE IF NOT EXISTS deal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE RESTRICT,
  price NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO deal_items (deal_id, stock_id, price)
SELECT id, stock_id, deal_price
FROM deals
WHERE stock_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM deal_items WHERE deal_items.deal_id = deals.id);

CREATE TABLE IF NOT EXISTS trade_in_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  estimated_value NUMERIC(15, 2) NOT NULL,
  converted_to_stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE payments
SET handled_by = admin_id
WHERE handled_by IS NULL AND admin_id IS NOT NULL;

ALTER TABLE finance_ledger ADD COLUMN IF NOT EXISTS ref_id VARCHAR(100);
ALTER TABLE finance_ledger ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE finance_ledger ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE finance_ledger
SET
  notes = COALESCE(notes, description),
  ref_id = COALESCE(ref_id, payment_id::TEXT, deal_id::TEXT, stock_id::TEXT),
  created_by = COALESCE(created_by, admin_id)
WHERE notes IS NULL OR ref_id IS NULL OR created_by IS NULL;

CREATE TABLE IF NOT EXISTS problem_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  issue_type VARCHAR(100) NOT NULL,
  stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (
    status IN (
      'Open',
      'Ditindaklanjuti',
      'Menunggu Customer',
      'Menunggu Pihak Ketiga',
      'Selesai',
      'Tidak bisa diselesaikan',
      'Permanen',
      'Refund',
      'Cancel'
    )
  ),
  chronology TEXT,
  resolution TEXT,
  handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  added_by UUID REFERENCES public_users(id) ON DELETE SET NULL,
  title_reference TEXT,
  account_specs TEXT,
  screenshot_url TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  capital_price INTEGER NOT NULL DEFAULT 0,
  asking_price INTEGER NOT NULL DEFAULT 0,
  sold_price INTEGER,
  status inventory_status NOT NULL DEFAULT 'UNPOSTED',
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (name);
CREATE INDEX IF NOT EXISTS deals_customer_id_idx ON deals (customer_id);
CREATE INDEX IF NOT EXISTS deals_deal_type_idx ON deals (deal_type);
CREATE INDEX IF NOT EXISTS deal_items_deal_id_idx ON deal_items (deal_id);
CREATE INDEX IF NOT EXISTS deal_items_stock_id_idx ON deal_items (stock_id);
CREATE INDEX IF NOT EXISTS trade_in_items_deal_id_idx ON trade_in_items (deal_id);
CREATE INDEX IF NOT EXISTS problem_cases_deal_id_idx ON problem_cases (deal_id);
CREATE INDEX IF NOT EXISTS problem_cases_stock_id_idx ON problem_cases (stock_id);
CREATE INDEX IF NOT EXISTS inventory_game_id_idx ON inventory (game_id);
CREATE INDEX IF NOT EXISTS inventory_status_idx ON inventory (status);

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('images', 'images', true),
  ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read images" ON storage.objects;

CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('images', 'screenshots'));

CREATE POLICY "Public can read images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('images', 'screenshots'));

CREATE OR REPLACE FUNCTION process_payment(
  p_deal_id UUID,
  p_account_id UUID,
  p_amount NUMERIC,
  p_notes TEXT,
  p_admin_id UUID
) RETURNS void AS $$
DECLARE
  v_deal deals%ROWTYPE;
  v_payment_id UUID;
  v_stock_id UUID;
  v_deal_price NUMERIC;
  v_new_total NUMERIC;
  v_new_percentage NUMERIC;
  v_new_deal_status deal_status;
  v_new_stock_status stock_status;
BEGIN
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;

  SELECT deal_items.stock_id INTO v_stock_id
  FROM deal_items
  WHERE deal_items.deal_id = p_deal_id
  ORDER BY created_at
  LIMIT 1;

  v_stock_id := COALESCE(v_deal.stock_id, v_stock_id);
  v_deal_price := COALESCE(NULLIF(v_deal.deal_price, 0), NULLIF(v_deal.total_deal_price, 0), 0);

  INSERT INTO payments (deal_id, account_id, amount, payment_type, status, notes, admin_id, handled_by)
  VALUES (p_deal_id, p_account_id, p_amount, 'IN', 'COMPLETED', p_notes, p_admin_id, p_admin_id)
  RETURNING id INTO v_payment_id;

  INSERT INTO finance_ledger (account_id, transaction_type, amount, deal_id, payment_id, stock_id, description, notes, ref_id, admin_id, created_by)
  VALUES (p_account_id, 'PAYMENT_IN', p_amount, p_deal_id, v_payment_id, v_stock_id, p_notes, p_notes, p_deal_id::TEXT, p_admin_id, p_admin_id);

  UPDATE accounts
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_account_id;

  v_new_total := v_deal.total_paid + p_amount;

  IF v_deal_price > 0 THEN
    v_new_percentage := (v_new_total / v_deal_price) * 100;
  ELSE
    v_new_percentage := 100;
  END IF;

  IF v_new_percentage >= 100 THEN
    v_new_deal_status := 'PAID';
    v_new_stock_status := 'SOLD';
  ELSIF v_new_percentage >= 70 THEN
    v_new_deal_status := 'LIMITED_ACCESS';
    v_new_stock_status := 'LIMITED_ACCESS';
  ELSIF v_new_percentage >= 20 THEN
    v_new_deal_status := 'BOOKED';
    v_new_stock_status := 'BOOKED';
  ELSE
    v_new_deal_status := 'DRAFT';
    v_new_stock_status := 'AVAILABLE';
  END IF;

  UPDATE deals
  SET total_paid = v_new_total,
      remaining_balance = v_deal_price - v_new_total,
      payment_percentage = v_new_percentage,
      status = v_new_deal_status,
      updated_at = NOW()
  WHERE id = p_deal_id;

  IF v_stock_id IS NOT NULL THEN
    UPDATE stocks
    SET status = v_new_stock_status,
        updated_at = NOW(),
        sold_date = CASE WHEN v_new_stock_status = 'SOLD' AND sold_date IS NULL THEN NOW() ELSE sold_date END,
        booking_date = CASE WHEN v_new_stock_status IN ('BOOKED', 'LIMITED_ACCESS', 'SOLD') AND booking_date IS NULL THEN NOW() ELSE booking_date END
    WHERE id = v_stock_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
