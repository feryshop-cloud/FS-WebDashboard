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

/**
 * Standard PostgreSQL ENUMs and definitions for Stock Statuses.
 * Synchronized with Database ENUM: public.stock_status
 */
export enum StockStatusEnum {
  DRAFT = "DRAFT",
  WAITING_PAYMENT = "WAITING_PAYMENT",
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
  LIMITED_ACCESS = "LIMITED_ACCESS",
  ON_HOLD = "ON_HOLD",
  PROBLEM = "PROBLEM",
  ARCHIVED = "ARCHIVED",
  SOLD = "SOLD",
}

export type StockStatus =
  | "DRAFT"
  | "WAITING_PAYMENT"
  | "AVAILABLE"
  | "BOOKED"
  | "LIMITED_ACCESS"
  | "ON_HOLD"
  | "PROBLEM"
  | "ARCHIVED"
  | "SOLD"
  | "UNPOSTED"
  | "PROBLEM_ACTION"
  | "PROBLEM_PERMANENT"
  | "CANCELLED";

export const StockStatus = StockStatusEnum;

export const StockStatusLabel: Record<string, string> = {
  DRAFT: "Draft",
  WAITING_PAYMENT: "Menunggu Pembayaran",
  AVAILABLE: "Tersedia",
  BOOKED: "Booking",
  LIMITED_ACCESS: "Akses Terbatas",
  ON_HOLD: "On Hold",
  PROBLEM: "Bermasalah",
  ARCHIVED: "Arsip",
  SOLD: "Terjual",
  // Aliases & legacy values
  UNPOSTED: "Draft",
  PENDING_PAYMENT: "Menunggu Pembayaran",
  "Menunggu Pembayaran": "Menunggu Pembayaran",
  PROBLEM_ACTION: "Bermasalah",
  PROBLEM_PERMANENT: "Bermasalah",
  Bermasalah: "Bermasalah",
  CANCELLED: "Dibatalkan",
  ARCHIVE: "Arsip",
  Arsip: "Arsip",
  Draft: "Draft",
  Tersedia: "Tersedia",
  Booking: "Booking",
  "Akses Terbatas": "Akses Terbatas",
  "On Hold": "On Hold",
  Terjual: "Terjual",
};

export const STOCK_STATUS_LIST = [
  { value: "DRAFT", label: "Draft" },
  { value: "WAITING_PAYMENT", label: "Menunggu Pembayaran" },
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "BOOKED", label: "Booking" },
  { value: "LIMITED_ACCESS", label: "Akses Terbatas" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "PROBLEM", label: "Bermasalah" },
  { value: "ARCHIVED", label: "Arsip" },
  { value: "SOLD", label: "Terjual" },
] as const;

export const STOCK_FORM_STATUS_OPTIONS = [
  { value: "DRAFT", label: "DRAFT (Draft)" },
  { value: "WAITING_PAYMENT", label: "WAITING_PAYMENT (Menunggu Pembayaran)" },
  { value: "AVAILABLE", label: "AVAILABLE (Tersedia)" },
  { value: "BOOKED", label: "BOOKED (Booking)" },
  { value: "LIMITED_ACCESS", label: "LIMITED_ACCESS (Akses Terbatas)" },
  { value: "ON_HOLD", label: "ON_HOLD (On Hold)" },
  { value: "PROBLEM", label: "PROBLEM (Bermasalah)" },
  { value: "ARCHIVED", label: "ARCHIVED (Arsip)" },
  { value: "SOLD", label: "SOLD (Terjual)" },
] as const;

export function normalizeStockStatus(status?: string | null): string {
  const s = (status || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (!s || s === "AVAILABLE" || s === "TERSEDIA") return "AVAILABLE";
  if (s === "DRAFT" || s === "UNPOSTED") return "DRAFT";
  if (s === "WAITING_PAYMENT" || s === "PENDING_PAYMENT" || s === "MENUNGGU_PEMBAYARAN")
    return "WAITING_PAYMENT";
  if (s === "BOOKED" || s === "BOOKING") return "BOOKED";
  if (s === "LIMITED_ACCESS" || s === "AKSES_TERBATAS") return "LIMITED_ACCESS";
  if (s === "ON_HOLD") return "ON_HOLD";
  if (s === "PROBLEM" || s === "BERMASALAH" || s === "PROBLEM_ACTION" || s === "PROBLEM_PERMANENT")
    return "PROBLEM";
  if (s === "ARCHIVED" || s === "ARCHIVE" || s === "ARSIP") return "ARCHIVED";
  if (s === "SOLD" || s === "TERJUAL") return "SOLD";
  return s;
}

export function isMatchingStockStatus(
  itemStatus: string | null | undefined,
  filter: string,
): boolean {
  if (!filter || filter === "ALL") return true;
  return normalizeStockStatus(itemStatus) === normalizeStockStatus(filter);
}
