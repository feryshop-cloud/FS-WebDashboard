-- Migration: 20260916210000_void_stock_purchase_rpc.sql
-- Description: Implement soft-delete (VOID/CANCELLED) for stocks, database trigger to sync inventory,
--              reversing entry (refund) in finance_ledger, and RPC orchestration for void and trash retrieval.

-- 1. Modifikasi Tabel stocks untuk mendukung Soft Delete
ALTER TABLE public.stocks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.public_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stocks_deleted_at ON public.stocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON public.stocks(status);

-- 2. Pembaruan RLS Policy Tabel stocks
-- Supaya query standar (termasuk dari UI Next.js) hanya membaca data aktif (belum dibatalkan)
DROP POLICY IF EXISTS "stocks_admin_access" ON public.stocks;
DROP POLICY IF EXISTS "stocks_admin_select" ON public.stocks;
DROP POLICY IF EXISTS "stocks_admin_insert" ON public.stocks;
DROP POLICY IF EXISTS "stocks_admin_update" ON public.stocks;
DROP POLICY IF EXISTS "stocks_admin_delete" ON public.stocks;

CREATE POLICY "stocks_admin_select" ON public.stocks
  FOR SELECT TO authenticated
  USING (public.is_admin() AND deleted_at IS NULL AND status != 'CANCELLED');

CREATE POLICY "stocks_admin_insert" ON public.stocks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "stocks_admin_update" ON public.stocks
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "stocks_admin_delete" ON public.stocks
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. Trigger Sinkronisasi inventory saat Stock di-VOID / Soft Delete
CREATE OR REPLACE FUNCTION public.sync_inventory_on_stock_void()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jika status diubah menjadi CANCELLED atau deleted_at terisi, hapus entri terkait di inventory
  IF (NEW.status = 'CANCELLED' OR NEW.deleted_at IS NOT NULL) THEN
    DELETE FROM public.inventory WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_on_stock_void ON public.stocks;
CREATE TRIGGER trg_sync_inventory_on_stock_void
  AFTER INSERT OR UPDATE ON public.stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_inventory_on_stock_void();

-- 4. Stored Procedure Orkestrasi Pembatalan / Void / Soft Delete Stok
CREATE OR REPLACE FUNCTION public.void_stock_purchase(p_stock_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_stock RECORD;
  v_ledger RECORD;
BEGIN
  -- Verifikasi admin
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Sesi admin tidak valid.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat menghapus stok.';
  END IF;

  -- Ambil data stok
  SELECT * INTO v_stock FROM public.stocks WHERE id = p_stock_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data stok tidak ditemukan.';
  END IF;

  -- Cek apakah sudah dibatalkan/dihapus
  IF v_stock.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Entri stok ini sudah pernah dihapus sebelumnya.';
  END IF;

  -- Pembedaan Logika:
  -- Jika stok BELUM TERJUAL (AVAILABLE, UNPOSTED, dll):
  -- Ini adalah pembatalan pembelian (VOID) -> batalkan modal di finance_ledger & set status CANCELLED
  IF v_stock.status NOT IN ('SOLD', 'BOOKED') THEN
    SELECT * INTO v_ledger
    FROM public.finance_ledger
    WHERE stock_id = p_stock_id AND transaction_type = 'STOCK_PURCHASE'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND AND v_ledger.account_id IS NOT NULL THEN
      -- Entri jurnal balik (REFUND / Kas masuk kembali)
      INSERT INTO public.finance_ledger (
        account_id,
        transaction_type,
        amount,
        stock_id,
        description,
        admin_id
      ) VALUES (
        v_ledger.account_id,
        'REFUND',
        ABS(v_ledger.amount),
        p_stock_id,
        'Pembatalan/Void Pembelian Stok ' || COALESCE(v_stock.sku, v_stock.name, p_stock_id::text),
        v_admin_id
      );

      -- Kembalikan saldo akun kas/bank
      UPDATE public.accounts
      SET balance = balance + ABS(v_ledger.amount),
          updated_at = NOW()
      WHERE id = v_ledger.account_id;
    END IF;

    -- Soft delete stok dan set status CANCELLED
    UPDATE public.stocks
    SET status = 'CANCELLED',
        deleted_at = NOW(),
        deleted_by = v_admin_id,
        updated_at = NOW()
    WHERE id = p_stock_id;
  ELSE
    -- Jika stok SUDAH TERJUAL (SOLD / BOOKED):
    -- Pengguna menghapus entri dari tampilan stok (soft delete riwayat).
    -- Uang modal sah terpakai dan penjualan sah, jadi TIDAK ADA jurnal balik (kas tidak di-refund).
    -- Status tetap dipertahankan ('SOLD' / 'BOOKED') agar laporan transaksi deals tetap konsisten.
    UPDATE public.stocks
    SET deleted_at = NOW(),
        deleted_by = v_admin_id,
        updated_at = NOW()
    WHERE id = p_stock_id;
  END IF;

  -- Hapus dari inventory jika masih ada
  DELETE FROM public.inventory WHERE id = p_stock_id;

  -- trg_sync_inventory_on_stock_void akan otomatis menghapus dari public.inventory
  -- trg_audit_stocks akan otomatis mencatat log audit ke audit_logs

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Entri stok berhasil dihapus.',
    'stock_id', p_stock_id
  );
END;
$$;

-- 5. Stored Procedure untuk Mengambil Data Stok yang Dibatalkan / Tong Sampah (Trash)
CREATE OR REPLACE FUNCTION public.get_trashed_stocks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat melihat data tong sampah.';
  END IF;

  SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_result
  FROM (
    SELECT
      s.id,
      s.sku,
      s.name,
      s.category,
      s.account_details,
      s.capital_price,
      s.status,
      s.purchase_payment_status,
      s.purchase_date,
      s.deleted_at,
      s.deleted_by,
      u.full_name AS deleted_by_name,
      fl.amount AS refund_amount,
      acc.name AS refund_account_name,
      s.created_at
    FROM public.stocks s
    LEFT JOIN public.public_users u ON s.deleted_by = u.id
    LEFT JOIN LATERAL (
      SELECT fl_inner.amount, fl_inner.account_id
      FROM public.finance_ledger fl_inner
      WHERE fl_inner.stock_id = s.id AND fl_inner.transaction_type = 'REFUND'
      ORDER BY fl_inner.created_at DESC
      LIMIT 1
    ) fl ON true
    LEFT JOIN public.accounts acc ON fl.account_id = acc.id
    WHERE s.deleted_at IS NOT NULL OR s.status = 'CANCELLED'
    ORDER BY s.deleted_at DESC NULLS LAST, s.created_at DESC
  ) item;

  RETURN v_result;
END;
$$;

-- Hak akses execute untuk authenticated user
GRANT EXECUTE ON FUNCTION public.void_stock_purchase(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trashed_stocks() TO authenticated;
