export const BuyStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type BuyStatus = (typeof BuyStatus)[keyof typeof BuyStatus];

export const BuyStatusLabel: Record<BuyStatus, string> = {
  [BuyStatus.PENDING]: "Menunggu",
  [BuyStatus.PROCESSING]: "Diproses",
  [BuyStatus.SUCCESS]: "Sukses",
  [BuyStatus.FAILED]: "Gagal",
};

export const PaymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  EXPIRED: "expired",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Menunggu",
  [PaymentStatus.PAID]: "Lunas",
  [PaymentStatus.FAILED]: "Gagal",
  [PaymentStatus.EXPIRED]: "Kadaluarsa",
};

export const VALID_BUY_STATUSES: readonly BuyStatus[] = Object.values(BuyStatus);
export const VALID_PAYMENT_STATUSES: readonly PaymentStatus[] = Object.values(PaymentStatus);
