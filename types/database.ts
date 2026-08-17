// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = "OWNER" | "ADMIN" | "VIEWER";
export type StockStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "LIMITED_ACCESS"
  | "SOLD"
  | "ON_HOLD"
  | "PROBLEM_ACTION"
  | "PROBLEM_PERMANENT"
  | "CANCELLED";
export type PurchasePaymentStatus = "LUNAS" | "PENDING";
export type DealStatus =
  | "DRAFT"
  | "BOOKED"
  | "LIMITED_ACCESS"
  | "PAID"
  | "CANCELLED_BY_BUYER"
  | "CANCELLED_BY_SELLER"
  | "REFUND_PARTIAL"
  | "REFUND_FULL"
  | "PROBLEM"
  | "COMPLETED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentType = "IN" | "OUT";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type ProblemCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "WAITING_THIRD_PARTY"
  | "RESOLVED"
  | "CANNOT_RESOLVE"
  | "PERMANENT"
  | "REFUND"
  | "CANCEL";
export type LedgerTransactionType =
  | "PAYMENT_IN"
  | "PAYMENT_OUT"
  | "REFUND"
  | "CASHBACK"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "STOCK_PURCHASE"
  | "ADJUSTMENT";
export type InventoryStatus = "UNPOSTED" | "AVAILABLE" | "SOLD";
export type OrderPaymentStatus = "pending" | "paid" | "success" | "failed" | "expired";
export type OrderBuyStatus = "pending" | "processing" | "success" | "failed";

export interface Order {
  id: string; // UUID
  order_id: string;
  user_id?: string | null;
  game_slug: string;
  product_id: string;
  product_title: string;
  id_games: string;
  server_games?: string | null;
  nickname?: string | null;
  quantity: number;
  price: number;
  fee: number;
  discount_price: number;
  promo_price: number;
  promo_code?: string | null;
  promo_discount: number;
  total_price: number;
  payment_method_id?: string | null;
  payment_name: string;
  payment_code: string;
  payment_code_display?: string | null;
  qr_string?: string | null;
  qr_image_url?: string | null;
  payment_status: OrderPaymentStatus;
  buy_status: OrderBuyStatus;
  serial_number?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  expired_time?: number | null;
  account_data?: Record<string, JsonValue> | null;
  pricing_json?: Record<string, JsonValue> | null;
  gateway_response?: Record<string, JsonValue> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface Role {
  id: string; // UUID
  name: string;
  permissions: Record<string, JsonValue>; // JSONB
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string; // UUID (matches auth.users)
  full_name: string;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string; // UUID
  name: string;
  account_number: string | null;
  type?: string;
  image_url?: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string; // UUID
  category: string;
  name: string;
  account_details: string | null;
  username: string | null;
  password: string | null;
  backup_code: string | null;

  sku?: string | null;
  account_detail?: string | null;
  login_info?: string | null;
  password_info?: string | null;
  notes?: string | null;
  managed_by?: string | null;

  capital_price: number;
  post_price: number;
  promo_price: number | null;
  current_price: number;

  status: StockStatus;
  purchase_payment_status: PurchasePaymentStatus;
  payment_account_id: string | null;

  purchase_date: string | null;
  post_date: string | null;
  booking_date: string | null;
  sold_date: string | null;

  seller_info: string | null;
  buyer_info: string | null;
  internal_notes: string | null;

  images: string[];

  admin_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string; // UUID
  deal_number: string;
  customer_name: string;
  customer_contact: string | null;

  customer_id?: string | null;
  deal_type?: string;
  total_deal_price?: number | null;
  handled_by?: string | null;

  stock_id: string;

  deal_price: number;
  total_paid: number;
  remaining_balance: number;
  payment_percentage: number;

  status: DealStatus;
  due_date: string | null;
  notes: string | null;

  admin_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string; // UUID
  deal_id: string;
  account_id: string;

  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;

  handled_by?: string | null;
  proof_url: string | null;
  notes: string | null;

  admin_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface FinanceLedger {
  id: string; // UUID
  account_id: string;

  transaction_type: LedgerTransactionType;
  amount: number; // Positive for IN, Negative for OUT

  deal_id: string | null;
  payment_id: string | null;
  stock_id: string | null;

  notes?: string | null;
  ref_id?: string | null;
  created_by?: string | null;

  description: string | null;
  admin_id: string | null;

  created_at: string;
}

export interface AuditLog {
  id: string; // UUID
  user_id: string | null;
  role_name: string | null;
  action: string;
  module: string;

  old_data: Record<string, JsonValue> | null;
  new_data: Record<string, JsonValue> | null;

  related_id: string | null;
  description: string | null;
  ip_address: string | null;

  created_at: string;
}

// ============================================================================
// RELATIONAL TYPES (Helpful for Supabase Joins)
// ============================================================================

export interface DealWithRelations extends Deal {
  stock?: Stock;
  payments?: Payment[];
  admin?: PublicUser;
  customers?: { name: string | null; phone?: string | null } | null;
  deal_items?: Array<{ stock_id?: string | null; stocks?: Partial<Stock> | null }>;
  total_deal_price?: number | null;
}

export interface PaymentWithRelations extends Payment {
  deal?: Deal;
  account?: Account;
  admin?: PublicUser;
}

export interface LedgerWithRelations extends FinanceLedger {
  account?: Account;
  accounts?: Pick<Account, "name"> | null;
  deal?: Deal;
  payment?: Payment;
  stock?: Stock;
  admin?: PublicUser;
  notes?: string | null;
  ref_id?: string | null;
}

export type JsonValue =
  string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface Game {
  id: string;
  name: string;
  slug?: string;
  image_url?: string | null;
  is_active?: boolean;
}

export interface InventoryItemWithGame {
  id: string;
  title_reference: string | null;
  name?: string | null;
  sku?: string | null;
  account_specs?: string | null;
  capital_price?: number;
  asking_price: number;
  sold_price?: number | null;
  status: InventoryStatus;
  created_at: string;
  sold_at?: string | null;
  image_urls?: string[];
  screenshot_url?: string | null;
  games?: Game | null;
}

export interface PurchaseWithRelations {
  id: string;
  game_id?: string;
  account_id?: string;
  purchase_date?: string;
  status?: string;
  sku?: string | null;
  name?: string | null;
  category?: string | null;
  seller_info?: string | null;
  capital_price?: number;
  purchase_payment_status?: PurchasePaymentStatus | null;
  created_at?: string;
  games?: Game | null;
  accounts?: Account | null;
  [key: string]: unknown;
}

export interface TradeInWithRelations {
  id: string;
  deal_number?: string;
  total_paid?: number;
  total_deal_price?: number | null;
  deal_items?: Array<{ stocks?: Stock | null }>;
  trade_in_items?: unknown[];
  [key: string]: unknown;
}

export interface ProblemCaseWithRelations {
  id: string;
  case_number?: string;
  title?: string;
  status?: string;
  issue_type?: string;
  created_at?: string;
  deals?: { deal_number?: string | null } | null;
  stocks?: { sku?: string | null; name?: string | null } | null;
  customers?: { name?: string | null } | null;
  deal?: Deal | null;
  stock?: Stock | null;
  [key: string]: unknown;
}
