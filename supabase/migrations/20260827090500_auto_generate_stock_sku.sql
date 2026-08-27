-- Migration: Auto Generate SKU and Fix Purchase Dates
-- Purpose: Ensure every stock purchase has a readable SKU identifier and valid purchase_date.

-- 1. Backfill existing null SKUs and purchase_date
UPDATE public.stocks
SET sku = 'STK-' || TO_CHAR(COALESCE(purchase_date, created_at, NOW()), 'YYMMDD') || '-' || UPPER(SUBSTRING(id::text FROM 1 FOR 6))
WHERE sku IS NULL OR sku = '';

UPDATE public.stocks
SET purchase_date = created_at
WHERE purchase_date IS NULL;

-- 2. Update process_stock_purchase to auto-generate SKU
CREATE OR REPLACE FUNCTION public.process_stock_purchase(
  p_category VARCHAR,
  p_name VARCHAR,
  p_account_details TEXT,
  p_username VARCHAR,
  p_password VARCHAR,
  p_capital_price NUMERIC,
  p_post_price NUMERIC,
  p_current_price NUMERIC,
  p_seller_info TEXT,
  p_internal_notes TEXT,
  p_purchase_payment_status purchase_payment_status,
  p_payment_account_id UUID,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_stock_id UUID;
  v_game_id UUID;
  v_specs TEXT;
  v_sku TEXT;
BEGIN
  v_stock_id := gen_random_uuid();
  v_sku := 'STK-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(v_stock_id::text FROM 1 FOR 6));

  -- 1. Insert into stocks (Legacy ERP stock table) with generated SKU
  INSERT INTO public.stocks (
    id, sku, category, name, account_details, username, password,
    capital_price, post_price, current_price, status, purchase_date,
    seller_info, internal_notes, admin_id, purchase_payment_status, payment_account_id
  ) VALUES (
    v_stock_id, v_sku, p_category, p_name, p_account_details, p_username, p_password,
    p_capital_price, p_post_price, p_current_price, 'AVAILABLE', NOW(),
    p_seller_info, p_internal_notes, p_admin_id, p_purchase_payment_status, p_payment_account_id
  );

  -- 2. If LUNAS, handle finance ledger and account balance
  IF p_purchase_payment_status = 'LUNAS' THEN
    IF p_payment_account_id IS NULL THEN
      RAISE EXCEPTION 'payment_account_id is required when status is LUNAS';
    END IF;

    -- Insert Finance Ledger (OUT)
    INSERT INTO public.finance_ledger (
      account_id, transaction_type, amount, stock_id, description, admin_id
    ) VALUES (
      p_payment_account_id, 'STOCK_PURCHASE', -p_capital_price, v_stock_id, 'Pembelian Stok Lunas', p_admin_id
    );

    -- Deduct Account Balance
    UPDATE public.accounts 
    SET balance = balance - p_capital_price 
    WHERE id = p_payment_account_id;
  END IF;

  -- 3. Resolve game_id for inventory table lookup
  SELECT id INTO v_game_id
  FROM public.games
  WHERE LOWER(name) = LOWER(p_category)
     OR LOWER(slug) = LOWER(p_category)
     OR LOWER(title) = LOWER(p_category)
     OR p_category ILIKE '%' || name || '%'
  ORDER BY (CASE WHEN LOWER(name) = LOWER(p_category) THEN 1 ELSE 2 END)
  LIMIT 1;

  -- If game_id is not matched directly, fallback to the first active game
  IF v_game_id IS NULL THEN
    SELECT id INTO v_game_id
    FROM public.games
    WHERE is_active = TRUE
    ORDER BY sort_order ASC
    LIMIT 1;
  END IF;

  -- Prepare specifications summary (safe format)
  v_specs := COALESCE(NULLIF(TRIM(p_account_details), ''), p_name);

  -- 4. Insert or update corresponding item in inventory table
  IF v_game_id IS NOT NULL THEN
    INSERT INTO public.inventory (
      id,
      game_id,
      added_by,
      title_reference,
      account_specs,
      capital_price,
      asking_price,
      status
    ) VALUES (
      v_stock_id,
      v_game_id,
      p_admin_id,
      p_name,
      v_specs,
      ROUND(p_capital_price)::INTEGER,
      ROUND(p_current_price)::INTEGER,
      'AVAILABLE'::public.inventory_status
    )
    ON CONFLICT (id) DO UPDATE SET
      game_id = EXCLUDED.game_id,
      title_reference = EXCLUDED.title_reference,
      account_specs = EXCLUDED.account_specs,
      capital_price = EXCLUDED.capital_price,
      asking_price = EXCLUDED.asking_price,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;

  RETURN v_stock_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
