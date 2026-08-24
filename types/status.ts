/**
 * Standard PostgreSQL ENUMs for Order Statuses.
 * Synchronized with Database ENUMs: public.order_payment_status & public.order_buy_status
 */

export enum OrderBuyStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
}

export type BuyStatus = OrderBuyStatus;
export const BuyStatus = OrderBuyStatus;

export const BuyStatusLabel: Record<OrderBuyStatus, string> = {
  [OrderBuyStatus.PENDING]: "Menunggu",
  [OrderBuyStatus.PROCESSING]: "Diproses",
  [OrderBuyStatus.SUCCESS]: "Sukses",
  [OrderBuyStatus.FAILED]: "Gagal",
};

export enum OrderPaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  SUCCESS = "success",
  FAILED = "failed",
  EXPIRED = "expired",
}

export type PaymentStatus = OrderPaymentStatus;
export const PaymentStatus = OrderPaymentStatus;

export const PaymentStatusLabel: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.PENDING]: "Menunggu",
  [OrderPaymentStatus.PAID]: "Lunas",
  [OrderPaymentStatus.SUCCESS]: "Sukses",
  [OrderPaymentStatus.FAILED]: "Gagal",
  [OrderPaymentStatus.EXPIRED]: "Kadaluarsa",
};

export const VALID_BUY_STATUSES: readonly OrderBuyStatus[] = Object.values(OrderBuyStatus);
export const VALID_PAYMENT_STATUSES: readonly OrderPaymentStatus[] =
  Object.values(OrderPaymentStatus);
