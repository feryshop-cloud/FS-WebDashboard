-- Migration: Sync Stock Purchases into Inventory
-- Purpose: When a stock purchase is recorded in ERP via process_stock_purchase,
--          automatically insert an entry into public.inventory so it is immediately
--          visible on the storefront and /dashboard/inventory.

CREATE OR REPLACE FUNCTION process_stock_purchase(
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
BEGIN
  -- 1. Insert into stocks (Legacy ERP stock table)
  INSERT INTO public.stocks (
    category, name, account_details, username, password,
    capital_price, post_price, current_price, status, purchase_date,
    seller_info, internal_notes, admin_id, purchase_payment_status, payment_account_id
  ) VALUES (
    p_category, p_name, p_account_details, p_username, p_password,
    p_capital_price, p_post_price, p_current_price, 'AVAILABLE', NOW(),
    p_seller_info, p_internal_notes, p_admin_id, p_purchase_payment_status, p_payment_account_id
  ) RETURNING id INTO v_stock_id;

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
