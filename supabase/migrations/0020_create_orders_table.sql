-- Migration: 0020_create_orders_table.sql
-- Description: Create orders table matching Drizzle schema in FS-Public

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id varchar(100) NOT NULL UNIQUE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  game_slug varchar(255) NOT NULL,
  product_id varchar(100) NOT NULL,
  product_title varchar(255) NOT NULL,
  id_games varchar(255) NOT NULL,
  server_games varchar(100),
  nickname varchar(255),
  quantity integer DEFAULT 1 NOT NULL,
  price numeric(15, 2) NOT NULL,
  fee numeric(15, 2) DEFAULT 0 NOT NULL,
  discount_price numeric(15, 2) DEFAULT 0,
  promo_price numeric(15, 2) DEFAULT 0,
  promo_code varchar(100),
  promo_discount numeric(15, 2) DEFAULT 0,
  total_price numeric(15, 2) NOT NULL,
  payment_method_id varchar(100),
  payment_name varchar(255) NOT NULL,
  payment_code varchar(100) NOT NULL,
  payment_code_display varchar(255),
  qr_string text,
  qr_image_url text,
  payment_status varchar(50) DEFAULT 'pending' NOT NULL,
  buy_status varchar(50) DEFAULT 'pending' NOT NULL,
  serial_number text DEFAULT '',
  whatsapp varchar(50),
  email varchar(255),
  expired_time integer,
  pricing_json jsonb,
  gateway_response jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public read-only access on orders') THEN
    CREATE POLICY "Allow public read-only access on orders" ON public.orders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow public insert access on orders') THEN
    CREATE POLICY "Allow public insert access on orders" ON public.orders FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow admin full access on orders') THEN
    CREATE POLICY "Allow admin full access on orders" ON public.orders FOR ALL USING (public.is_admin());
  END IF;
END $$;
