-- 0044: Tabel promo_codes + RPC validate_promo + RLS
-- Pemilik skema: game-inventori. Storefront baca kode via RPC, bukan SELECT tabel.

-- =============================================================
-- 1. Tabel promo_codes
-- =============================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id            serial PRIMARY KEY,
  code          varchar(100) NOT NULL UNIQUE,
  discount_type varchar(50)  NOT NULL DEFAULT 'percent',   -- percent | fixed
  discount_value numeric(15,2) NOT NULL,
  min_order     numeric(15,2) DEFAULT 0,
  max_discount  numeric(15,2) DEFAULT 0,
  quota         integer DEFAULT 100,
  used_count    integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  start_date    timestamptz,
  end_date      timestamptz,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- =============================================================
-- 2. RLS: TANPA policy SELECT publik (R4). Admin full via is_admin().
-- =============================================================
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promo_codes' AND policyname = 'promo_codes admin all') THEN
    CREATE POLICY "promo_codes admin all"
      ON public.promo_codes FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- =============================================================
-- 3. RPC validate_promo (SECURITY DEFINER)
--    Publik tidak bisa SELECT tabel; satu-satunya pintu baca = fungsi ini.
--    Kembalikan hanya field yang diperlukan (bukan seluruh tabel).
-- =============================================================
CREATE OR REPLACE FUNCTION public.validate_promo(p_code text, p_subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        record;
  discount numeric;
BEGIN
  SELECT * INTO r FROM public.promo_codes WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'err', 'not_found');
  ELSIF NOT r.is_active THEN
    RETURN jsonb_build_object('ok', false, 'err', 'inactive');
  ELSIF r.start_date IS NOT NULL AND r.start_date > now() THEN
    RETURN jsonb_build_object('ok', false, 'err', 'not_started');
  ELSIF r.end_date IS NOT NULL AND r.end_date < now() THEN
    RETURN jsonb_build_object('ok', false, 'err', 'expired');
  ELSIF p_subtotal < r.min_order THEN
    RETURN jsonb_build_object('ok', false, 'err', 'min_order');
  ELSIF r.used_count >= r.quota THEN
    RETURN jsonb_build_object('ok', false, 'err', 'quota');
  END IF;

  discount := CASE
    WHEN r.discount_type = 'percent' THEN p_subtotal * r.discount_value / 100
    ELSE r.discount_value
  END;
  IF r.max_discount > 0 AND discount > r.max_discount THEN
    discount := r.max_discount;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'code', r.code,
    'discount', discount,
    'discount_type', r.discount_type,
    'discount_value', r.discount_value,
    'min_order', r.min_order,
    'max_discount', r.max_discount,
    'used_count', r.used_count,
    'quota', r.quota,
    'start_date', r.start_date,
    'end_date', r.end_date
  );
END $$;

-- Ukuran-P int. publ anon/authenticated boleh panggil RPC (untuk storefront validate)
REVOKE ALL ON FUNCTION public.validate_promo(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, numeric) TO anon, authenticated;