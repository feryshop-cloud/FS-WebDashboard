-- Migration: 0018_topup_products_schema.sql
-- Description: Storefront Top-Up legacy schema (categories, products, payment_methods) with RLS

CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  title varchar(255) NOT NULL,
  logo text,
  game_slug varchar(255) NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id varchar(100) PRIMARY KEY,
  game_slug varchar(255) NOT NULL,
  category_id integer REFERENCES public.categories(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  selling_price numeric(15,2) NOT NULL,
  selling_price_gold numeric(15,2) NOT NULL,
  selling_price_platinum numeric(15,2) NOT NULL,
  promo_price numeric(15,2),
  cost_price numeric(15,2) DEFAULT 0,
  sku varchar(100),
  images text,
  logo text,
  is_active boolean DEFAULT true,
  is_gangguan boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id varchar(100) PRIMARY KEY,
  name varchar(255) NOT NULL,
  images text,
  payment_id varchar(100) NOT NULL,
  minimum_amount numeric(15,2) DEFAULT 1000 NOT NULL,
  maximum_amount numeric(15,2) DEFAULT 10000000 NOT NULL,
  fee numeric(15,2) DEFAULT 0 NOT NULL,
  fee_percent numeric(5,2) DEFAULT 0 NOT NULL,
  type varchar(100) NOT NULL,
  status varchar(50) DEFAULT 'active' NOT NULL,
  "group" varchar(100) DEFAULT 'E-Wallet' NOT NULL,
  is_outside_group boolean DEFAULT false,
  badge_text varchar(100),
  outside_sort integer DEFAULT 0,
  instructions jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow public read-only access on categories') THEN
    CREATE POLICY "Allow public read-only access on categories" ON public.categories FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow admin full access on categories') THEN
    CREATE POLICY "Allow admin full access on categories" ON public.categories FOR ALL USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read-only access on products') THEN
    CREATE POLICY "Allow public read-only access on products" ON public.products FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow admin full access on products') THEN
    CREATE POLICY "Allow admin full access on products" ON public.products FOR ALL USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Allow public read-only access on payment_methods') THEN
    CREATE POLICY "Allow public read-only access on payment_methods" ON public.payment_methods FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Allow admin full access on payment_methods') THEN
    CREATE POLICY "Allow admin full access on payment_methods" ON public.payment_methods FOR ALL USING (public.is_admin());
  END IF;
END $$;
