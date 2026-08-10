export const LEDGER_TYPE_LABELS: Record<string, string> = {
  PAYMENT_IN: "Pembayaran Masuk",
  PAYMENT_OUT: "Pembayaran Keluar",
  REFUND: "Refund",
  CASHBACK: "Cashback",
  TRANSFER_IN: "Mutasi Masuk",
  TRANSFER_OUT: "Mutasi Keluar",
  STOCK_PURCHASE: "Pembelian Stok",
  ADJUSTMENT: "Penyesuaian",
};

export function ledgerTypeLabel(type: string): string {
  return LEDGER_TYPE_LABELS[type] || type;
}
