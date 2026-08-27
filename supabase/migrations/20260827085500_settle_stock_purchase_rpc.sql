-- Migration: Add settle_stock_purchase RPC
-- Purpose: Allows settling a PENDING stock purchase by selecting a payment account,
--          deducting the account balance, inserting a finance ledger entry, and updating
--          the purchase payment status to LUNAS atomically.

CREATE OR REPLACE FUNCTION public.settle_stock_purchase(
  p_stock_id UUID,
  p_account_id UUID,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_stock RECORD;
BEGIN
  -- 1. Fetch and validate the stock purchase
  SELECT id, capital_price, purchase_payment_status, name
  INTO v_stock
  FROM public.stocks
  WHERE id = p_stock_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data pembelian stok tidak ditemukan.';
  END IF;

  IF v_stock.purchase_payment_status = 'LUNAS' THEN
    RAISE EXCEPTION 'Pembelian stok ini sudah berstatus LUNAS.';
  END IF;

  IF p_account_id IS NULL THEN
    RAISE EXCEPTION 'Rekening pembayaran wajib dipilih untuk pelunasan.';
  END IF;

  -- 2. Insert into finance ledger (OUT / EXPENSE)
  INSERT INTO public.finance_ledger (
    account_id,
    transaction_type,
    amount,
    stock_id,
    description,
    admin_id
  ) VALUES (
    p_account_id,
    'STOCK_PURCHASE',
    -v_stock.capital_price,
    p_stock_id,
    'Pelunasan Pembelian Stok: ' || COALESCE(v_stock.name, 'Akun'),
    p_admin_id
  );

  -- 3. Deduct account balance
  UPDATE public.accounts
  SET balance = balance - v_stock.capital_price,
      updated_at = NOW()
  WHERE id = p_account_id;

  -- 4. Update stock status to LUNAS and link payment_account_id
  UPDATE public.stocks
  SET purchase_payment_status = 'LUNAS',
      payment_account_id = p_account_id,
      updated_at = NOW()
  WHERE id = p_stock_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.settle_stock_purchase(UUID, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_stock_purchase(UUID, UUID, UUID) TO authenticated, service_role;
