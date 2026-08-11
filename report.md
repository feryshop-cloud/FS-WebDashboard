# TECHNICAL & UI AUDIT REPORT: DASHBOARD-ADMIN

## 1. EXECUTIVE SUMMARY
This audit report presents a microscopic review of the standalone `dashboard-admin` project. While the application displays a highly premium, modern dark/light UI with styled components, the backend integration is currently in a fractured state. While basic read operations on tables like `stocks`, `deals`, `accounts`, and `finance_ledger` succeed, critical mutations (adding stock, recording purchases, creating deals, mutasi transfer) are completely broken at runtime. This is due to severe mismatches between the database schema built (via `init_schema_clean` / `schema_draft.sql`) and the assumptions made in the migration files (`0000_...` to `0005_...`) and Next.js Server Actions. Specifically, SQL RPC functions refer to non-existent columns, and server actions insert uppercase English enums that violate Postgres CHECK constraints. Furthermore, several features—such as the FerryMail inbox, system settings (users and categories management), and promotion templates—are currently populated by 100% hardcoded static mock data. Lastly, the database is completely empty of seeded data, real-time sync is absent, and the `public.users` table has zero rows, causing foreign key violations for any authenticated actions.

---

## 2. ACTUAL TECH STACK USED
| Layer | Exact Technology & Version | Evidence (config file name & line number) |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2.9 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L15) |
| **UI Library** | React 19.2.4 / React DOM 19.2.4 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L16-L17) |
| **Styling** | Tailwind CSS 4.0.0 (via `@tailwindcss/postcss`) | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L22-L28) |
| **Database SDK** | Supabase SSR 0.12.0 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L13) |
| **Charts** | Recharts 3.8.1 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L18) |
| **Icons** | Phosphor Icons 2.1.10 & Lucide React 1.18.0 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L12-L14) |
| **Validation** | Zod 4.4.3 | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L19) |
| **Language** | TypeScript 5.x | [package.json](file:///c:/Users/171106/Downloads/game/package.json#L29) |

---

## 3. ACTUAL DATABASE SCHEMA (BUILT, NOT PLANNED)

### 3.1. Accounts Table (`public.accounts`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `name` (character varying, nullable: NO, default: `NULL`)
    *   `type` (character varying, nullable: NO, default: `NULL`)
    *   `account_number` (character varying, nullable: YES, default: `NULL`)
    *   `balance` (numeric, nullable: NO, default: `0`)
    *   `is_active` (boolean, nullable: YES, default: `true`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `accounts_pkey` (btree (id) UNIQUE)

### 3.2. Audit Logs Table (`public.audit_logs`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `user_id` (uuid, nullable: YES, default: `NULL`)
    *   `module` (character varying, nullable: NO, default: `NULL`)
    *   `action` (character varying, nullable: NO, default: `NULL`)
    *   `record_id` (uuid, nullable: YES, default: `NULL`)
    *   `old_data` (jsonb, nullable: YES, default: `NULL`)
    *   `new_data` (jsonb, nullable: YES, default: `NULL`)
    *   `description` (text, nullable: YES, default: `NULL`)
    *   `ip_address` (character varying, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `audit_logs_pkey` (btree (id) UNIQUE)

### 3.3. Customers Table (`public.customers`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `name` (character varying, nullable: NO, default: `NULL`)
    *   `phone` (character varying, nullable: YES, default: `NULL`)
    *   `email` (character varying, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:** None (Access denied to public/authenticated users via Client SDK)
*   **Indexes:**
    *   `customers_pkey` (btree (id) UNIQUE)

### 3.4. Deal Items Table (`public.deal_items`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `deal_id` (uuid, nullable: YES, default: `NULL`)
    *   `stock_id` (uuid, nullable: YES, default: `NULL`)
    *   `price` (numeric, nullable: NO, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:** None
*   **Indexes:**
    *   `deal_items_pkey` (btree (id) UNIQUE)

### 3.5. Deals Table (`public.deals`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `deal_number` (character varying, nullable: NO, default: `NULL`)
    *   `customer_id` (uuid, nullable: YES, default: `NULL`)
    *   `deal_type` (character varying, nullable: YES, default: `'Penjualan'::character varying`)
    *   `total_deal_price` (numeric, nullable: NO, default: `0`)
    *   `total_paid` (numeric, nullable: NO, default: `0`)
    *   `status` (character varying, nullable: YES, default: `'Draft'::character varying`)
    *   `due_date` (timestamp with time zone, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `handled_by` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `deals_deal_type_check`: `deal_type::text = ANY (ARRAY['Penjualan'::character varying, 'Tukar Tambah'::character varying]::text[])`
    *   `deals_status_check`: `status::text = ANY (ARRAY['Draft'::character varying, 'Booking'::character varying, 'Akses Terbatas'::character varying, 'Lunas'::character varying, 'Cancel oleh Pembeli'::character varying, 'Cancel oleh Feryshop'::character varying, 'Refund Sebagian'::character varying, 'Refund Penuh'::character varying, 'Bermasalah'::character varying, 'Selesai'::character varying]::text[])`
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `deals_pkey` (btree (id) UNIQUE)
    *   `deals_deal_number_key` (btree (deal_number) UNIQUE)

### 3.6. Finance Ledger Table (`public.finance_ledger`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `account_id` (uuid, nullable: YES, default: `NULL`)
    *   `transaction_type` (character varying, nullable: NO, default: `NULL`)
    *   `amount` (numeric, nullable: NO, default: `NULL`)
    *   `ref_id` (character varying, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `created_by` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `finance_ledger_transaction_type_check`: `transaction_type::text = ANY (ARRAY['Mutasi Masuk'::character varying, 'Mutasi Keluar'::character varying, 'Pembayaran Masuk'::character varying, 'Penyesuaian'::character varying, 'Refund'::character varying, 'Pengeluaran Operasional'::character varying, 'Pembayaran Pembelian Stok'::character varying]::text[])`
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `finance_ledger_pkey` (btree (id) UNIQUE)

### 3.7. Game Products Table (`public.game_products`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `gen_random_uuid()`)
    *   `title` (text, nullable: NO)
    *   `slug` (text, nullable: NO)
    *   `category` (text, nullable: NO)
    *   `price` (numeric, nullable: NO)
    *   `rank` (text, nullable: YES)
    *   `skin_count` (integer, nullable: YES)
    *   `status` (text, nullable: YES, default: `'available'::text`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:**
    *   `Allow public read access` (cmd: `SELECT`, roles: `{public}`, qual: `true`)
*   **Indexes:**
    *   `game_products_pkey` (btree (id) UNIQUE)
    *   `game_products_slug_key` (btree (slug) UNIQUE)

### 3.8. Games Table (`public.games`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `gen_random_uuid()`)
    *   `name` (text, nullable: NO)
    *   `slug` (text, nullable: NO)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `image_url` (text, nullable: YES)
*   **RLS Policies:**
    *   `Allow public read access` (cmd: `SELECT`, roles: `{public}`, qual: `true`)
    *   `Allow public inserts` (cmd: `INSERT`, roles: `{public}`, with_check: `true`)
    *   `Allow authenticated updates` (cmd: `UPDATE`, roles: `{public}`, with_check: `true`)
    *   `Allow authenticated deletes` (cmd: `DELETE`, roles: `{public}`, qual: `true`)
*   **Indexes:**
    *   `games_pkey` (btree (id) UNIQUE)
    *   `games_name_key` (btree (name) UNIQUE)
    *   `games_slug_key` (btree (slug) UNIQUE)

### 3.9. Incoming Emails Table (`public.incoming_emails`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `gen_random_uuid()`)
    *   `recipient_email` (text, nullable: NO)
    *   `sender_email` (text, nullable: NO)
    *   `subject` (text, nullable: NO)
    *   `otp_code` (text, nullable: YES)
    *   `raw_body_snippet` (text, nullable: YES)
    *   `received_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `category` (text, nullable: YES, default: `'login_otp'::text`)
    *   `visibility` (text, nullable: YES, default: `'buyer'::text`)
*   **RLS Policies:**
    *   `Allow public read access` (cmd: `SELECT`, roles: `{public}`, qual: `true`)
    *   `Public read access for buyer visibility` (cmd: `SELECT`, roles: `{public}`, qual: `(visibility = 'buyer'::text)`)
*   **Indexes:**
    *   `incoming_emails_pkey` (btree (id) UNIQUE)
    *   `idx_incoming_emails_received_at` (btree (received_at DESC))
    *   `idx_incoming_emails_recipient` (btree (recipient_email))

### 3.10. Inventory Table (`public.inventory`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `gen_random_uuid()`)
    *   `game_id` (uuid, nullable: NO)
    *   `added_by` (uuid, nullable: YES)
    *   `title_reference` (text, nullable: YES)
    *   `account_specs` (text, nullable: YES)
    *   `screenshot_url` (text, nullable: YES)
    *   `capital_price` (integer, nullable: NO)
    *   `asking_price` (integer, nullable: NO)
    *   `sold_price` (integer, nullable: YES)
    *   `status` (USER-DEFINED `inventory_status`, nullable: YES, default: `'UNPOSTED'::inventory_status`, enums: `['UNPOSTED', 'AVAILABLE', 'SOLD']`)
    *   `sold_at` (timestamp with time zone, nullable: YES)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `image_urls` (text[], nullable: YES, default: `'{}'::text[]`)
*   **RLS Policies:**
    *   `Allow public select` (cmd: `SELECT`, roles: `{public}`, qual: `true`)
    *   `Allow public inserts` (cmd: `INSERT`, roles: `{public}`, with_check: `true`)
*   **Indexes:**
    *   `inventory_pkey` (btree (id) UNIQUE)

### 3.11. Payments Table (`public.payments`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `deal_id` (uuid, nullable: YES, default: `NULL`)
    *   `account_id` (uuid, nullable: YES, default: `NULL`)
    *   `amount` (numeric, nullable: NO, default: `NULL`)
    *   `payment_type` (character varying, nullable: NO, default: `NULL`)
    *   `status` (character varying, nullable: YES, default: `'Selesai'::character varying`)
    *   `proof_url` (text, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `handled_by` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `payments_payment_type_check`: `payment_type::text = ANY (ARRAY['DP'::character varying, 'Cicilan'::character varying, 'Pelunasan'::character varying, 'Refund'::character varying, 'Cashback TT'::character varying, 'Pembelian Stok'::character varying]::text[])`
    *   `payments_status_check`: `status::text = ANY (ARRAY['Pending'::character varying, 'Selesai'::character varying, 'Bermasalah'::character varying]::text[])`
*   **RLS Policies:** None
*   **Indexes:**
    *   `payments_pkey` (btree (id) UNIQUE)

### 3.12. Permissions Table (`public.permissions`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `module` (character varying, nullable: NO, default: `NULL`)
    *   `action` (character varying, nullable: NO, default: `NULL`)
    *   `description` (text, nullable: YES, default: `NULL`)
*   **RLS Policies:** None
*   **Indexes:**
    *   `permissions_pkey` (btree (id) UNIQUE)
    *   `permissions_module_action_key` (btree (module, action) UNIQUE)

### 3.13. Problem Cases Table (`public.problem_cases`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `case_number` (character varying, nullable: NO, default: `NULL`)
    *   `issue_type` (character varying, nullable: NO, default: `NULL`)
    *   `stock_id` (uuid, nullable: YES, default: `NULL`)
    *   `deal_id` (uuid, nullable: YES, default: `NULL`)
    *   `customer_id` (uuid, nullable: YES, default: `NULL`)
    *   `status` (character varying, nullable: YES, default: `'Open'::character varying`)
    *   `chronology` (text, nullable: YES, default: `NULL`)
    *   `resolution` (text, nullable: YES, default: `NULL`)
    *   `handled_by` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `problem_cases_status_check`: `status::text = ANY (ARRAY['Open'::character varying, 'Ditindaklanjuti'::character varying, 'Menunggu Customer'::character varying, 'Menunggu Pihak Ketiga'::character varying, 'Selesai'::character varying, 'Tidak bisa diselesaikan'::character varying, 'Permanen'::character varying, 'Refund'::character varying, 'Cancel'::character varying]::text[])`
*   **RLS Policies:** None
*   **Indexes:**
    *   `problem_cases_pkey` (btree (id) UNIQUE)
    *   `problem_cases_case_number_key` (btree (case_number) UNIQUE)

### 3.14. Public Users Table (`public.public_users`)
*   **Columns:**
    *   `id` (uuid, nullable: NO)
    *   `full_name` (character varying, nullable: NO)
    *   `role_id` (uuid, nullable: YES)
    *   `is_active` (boolean, nullable: NO, default: `true`)
    *   `created_at` (timestamp with time zone, nullable: NO, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: NO, default: `now()`)
*   **RLS Policies:**
    *   `Allow authenticated full access to public_users` (cmd: `ALL`, roles: `{authenticated}`, qual: `true`)
*   **Indexes:**
    *   `public_users_pkey` (btree (id) UNIQUE)

### 3.15. Role Permissions Table (`public.role_permissions`)
*   **Columns:**
    *   `role_id` (uuid, nullable: NO)
    *   `permission_id` (uuid, nullable: NO)
*   **RLS Policies:** None
*   **Indexes:**
    *   `role_permissions_pkey` (btree (role_id, permission_id) UNIQUE)

### 3.16. Roles Table (`public.roles`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `name` (character varying, nullable: NO, default: `NULL`)
    *   `description` (text, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:** None
*   **Indexes:**
    *   `roles_pkey` (btree (id) UNIQUE)
    *   `roles_name_key` (btree (name) UNIQUE)

### 3.17. Stock Histories Table (`public.stock_histories`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `stock_id` (uuid, nullable: YES, default: `NULL`)
    *   `status` (character varying, nullable: NO, default: `NULL`)
    *   `changed_by` (uuid, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:** None
*   **Indexes:**
    *   `stock_histories_pkey` (btree (id) UNIQUE)

### 3.18. Stocks Table (`public.stocks`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `sku` (character varying, nullable: NO, default: `NULL`)
    *   `category` (character varying, nullable: NO, default: `NULL`)
    *   `name` (character varying, nullable: NO, default: `NULL`)
    *   `account_detail` (text, nullable: YES, default: `NULL`)
    *   `login_info` (text, nullable: YES, default: `NULL`)
    *   `password_info` (text, nullable: YES, default: `NULL`)
    *   `backup_code` (text, nullable: YES, default: `NULL`)
    *   `capital_price` (numeric, nullable: NO, default: `0`)
    *   `post_price` (numeric, nullable: NO, default: `0`)
    *   `current_price` (numeric, nullable: NO, default: `0`)
    *   `status` (character varying, nullable: YES, default: `'Tersedia'::character varying`)
    *   `purchase_date` (timestamp with time zone, nullable: YES, default: `NULL`)
    *   `seller_info` (text, nullable: YES, default: `NULL`)
    *   `notes` (text, nullable: YES, default: `NULL`)
    *   `managed_by` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `stocks_status_check`: `status::text = ANY (ARRAY['Tersedia'::character varying, 'Booking'::character varying, 'Akses Terbatas'::character varying, 'Terjual'::character varying, 'On Hold'::character varying, 'Bermasalah - Ditindaklanjuti'::character varying, 'Bermasalah - Permanen'::character varying, 'Cancel'::character varying]::text[])`
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `stocks_pkey` (btree (id) UNIQUE)
    *   `stocks_sku_key` (btree (sku) UNIQUE)

### 3.19. Trade In Items Table (`public.trade_in_items`)
*   **Columns:**
    *   `id` (uuid, nullable: NO, default: `uuid_generate_v4()`)
    *   `deal_id` (uuid, nullable: YES, default: `NULL`)
    *   `description` (text, nullable: NO, default: `NULL`)
    *   `estimated_value` (numeric, nullable: NO, default: `NULL`)
    *   `converted_to_stock_id` (uuid, nullable: YES, default: `NULL`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **RLS Policies:** None
*   **Indexes:**
    *   `trade_in_items_pkey` (btree (id) UNIQUE)

### 3.20. Users Table (`public.users`)
*   **Columns:**
    *   `id` (uuid, nullable: NO)
    *   `role_id` (uuid, nullable: YES, default: `NULL`)
    *   `full_name` (character varying, nullable: NO, default: `NULL`)
    *   `email` (character varying, nullable: NO, default: `NULL`)
    *   `status` (character varying, nullable: YES, default: `'Aktif'::character varying`)
    *   `created_at` (timestamp with time zone, nullable: YES, default: `now()`)
    *   `updated_at` (timestamp with time zone, nullable: YES, default: `now()`)
*   **Check Constraints:**
    *   `users_status_check`: `status::text = ANY (ARRAY['Aktif'::character varying, 'Nonaktif'::character varying]::text[])`
*   **RLS Policies:**
    *   `Allow authenticated read access` (cmd: `SELECT`, roles: `{public}`, qual: `auth.role() = 'authenticated'`)
*   **Indexes:**
    *   `users_pkey` (btree (id) UNIQUE)
    *   `users_email_key` (btree (email) UNIQUE)

---

## 4. COMPREHENSIVE MAPPING: MENU/FEATURE/ICON/FILTER -> DATA SOURCE -> REALTIME STATUS

| Menu/Feature/Icon/Filter | File Component | Supabase Table Used | Operation | Realtime or Fetch Once? | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Command Center** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/page.tsx) | `accounts`, `stocks`, `deals`, `deal_items`, `finance_ledger` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L16-L21](file:///c:/Users/171106/Downloads/game/app/dashboard/page.tsx#L16-L21) |
| **Daftar Stok** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/inventory/page.tsx) | `stocks` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L25](file:///c:/Users/171106/Downloads/game/app/dashboard/inventory/page.tsx#L25) |
| **Tambah Stok** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/inventory/page.tsx) | `stocks` | INSERT | FETCH ONCE ON LOAD | [inventory.ts#L39-L49](file:///c:/Users/171106/Downloads/game/app/actions/inventory.ts#L39-L49) |
| **Pembelian Stok** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/purchases/page.tsx) | `stocks`, `accounts` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L36-L38](file:///c:/Users/171106/Downloads/game/app/dashboard/purchases/page.tsx#L36-L38) |
| **Catat Pembelian** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/purchases/page.tsx) | `stocks`, `finance_ledger`, `accounts` | INSERT, UPDATE (via broken RPC) | FETCH ONCE ON LOAD | [purchases.ts#L35](file:///c:/Users/171106/Downloads/game/actions/purchases.ts#L35) |
| **Daftar Deal** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/deals/page.tsx) | `deals`, `customers`, `deal_items`, `stocks` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L32-L34](file:///c:/Users/171106/Downloads/game/app/dashboard/deals/page.tsx#L32-L34) |
| **Buat Deal Baru** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/deals/page.tsx) | `deals`, `customers`, `deal_items`, `stocks`, `payments`, `finance_ledger` | SELECT, INSERT, UPDATE | FETCH ONCE ON LOAD | [deals.ts#L28-L115](file:///c:/Users/171106/Downloads/game/app/actions/deals.ts#L28-L115) |
| **Tukar Tambah** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/trade-in/page.tsx) | `deals`, `customers`, `deal_items`, `trade_in_items` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L36-L38](file:///c:/Users/171106/Downloads/game/app/dashboard/trade-in/page.tsx#L36-L38) |
| **Buat Transaksi TT** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/trade-in/page.tsx) | `deals`, `customers`, `deal_items`, `trade_in_items`, `stocks`, `payments`, `finance_ledger`, `accounts` | SELECT, INSERT, UPDATE | FETCH ONCE ON LOAD | [trade-in.ts#L32-L282](file:///c:/Users/171106/Downloads/game/app/actions/trade-in.ts#L32-L282) |
| **Kelola Rekening** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx) | `accounts` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L26](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx#L26) |
| **Tambah Rekening** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx) | `accounts` | INSERT | FETCH ONCE ON LOAD | [accounts.ts#L29-L35](file:///c:/Users/171106/Downloads/game/app/actions/accounts.ts#L29-L35) |
| **Proses Mutasi** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx) | `accounts`, `finance_ledger` | UPDATE (via broken RPC) | FETCH ONCE ON LOAD | [accounts.ts#L67](file:///c:/Users/171106/Downloads/game/app/actions/accounts.ts#L67) |
| **Buku Kas / Ledger** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/ledger/page.tsx) | `finance_ledger`, `accounts` | SELECT | FETCH ONCE ON LOAD | [ledger.ts#L5-L23](file:///c:/Users/171106/Downloads/game/app/actions/ledger.ts#L5-L23) |
| **FerryMail Inbox** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/ferrymail/page.tsx) | `incoming_emails` (not queried) | None | NOT CONNECTED TO DATABASE | [page.tsx#L78](file:///c:/Users/171106/Downloads/game/app/dashboard/ferrymail/page.tsx#L78) |
| **Laba Rugi** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/reports/profit-loss/page.tsx) | `deals`, `deal_items`, `stocks`, `finance_ledger` | SELECT | FETCH ONCE ON LOAD | [reports.ts#L5-L88](file:///c:/Users/171106/Downloads/game/app/actions/reports.ts#L5-L88) |
| **Arus Kas** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/reports/cashflow/page.tsx) | `finance_ledger`, `accounts` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L29](file:///c:/Users/171106/Downloads/game/app/dashboard/reports/cashflow/page.tsx#L29) |
| **Arus Kas Export CSV** (Button) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/reports/cashflow/page.tsx) | `finance_ledger` (client-side state) | None | FETCH ONCE ON LOAD | [page.tsx#L163-L186](file:///c:/Users/171106/Downloads/game/app/dashboard/reports/cashflow/page.tsx#L163-L186) |
| **Problem Cases** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/problem-cases/page.tsx) | `problem_cases`, `deals`, `stocks`, `customers` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L28](file:///c:/Users/171106/Downloads/game/app/dashboard/problem-cases/page.tsx#L28) |
| **Simpan Case Baru** (Form Submit) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/problem-cases/page.tsx) | `problem_cases`, `audit_logs` | INSERT | FETCH ONCE ON LOAD | [problem-cases.ts#L25-L92](file:///c:/Users/171106/Downloads/game/app/actions/problem-cases.ts#L25-L92) |
| **Template Promosi** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/templates/page.tsx) | None | None | NOT CONNECTED TO DATABASE | [page.tsx#L5-L27](file:///c:/Users/171106/Downloads/game/app/dashboard/templates/page.tsx#L5-L27) |
| **Pengaturan** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/settings/page.tsx) | `users`, `games` (not queried) | None | NOT CONNECTED TO DATABASE | [page.tsx#L5-L18](file:///c:/Users/171106/Downloads/game/app/dashboard/settings/page.tsx#L5-L18) |
| **Audit Log** (Menu) | [page.tsx](file:///c:/Users/171106/Downloads/game/app/dashboard/audit-log/page.tsx) | `audit_logs`, `users` | SELECT | FETCH ONCE ON LOAD | [page.tsx#L18](file:///c:/Users/171106/Downloads/game/app/dashboard/audit-log/page.tsx#L18) |
| **Search/Filter inputs** (Visual elements) | Multiple components | None (except client-side state filtering) | None | NOT CONNECTED TO DATABASE | (Various input components with no query binding) |

---

## 5. DETAILED WORKFLOW PER FEATURE

### 5.1. Tambah Stok Baru
*   **Trigger:** Click on `Tambah Stok` button in [app/dashboard/inventory/page.tsx:L61](file:///c:/Users/171106/Downloads/game/app/dashboard/inventory/page.tsx#L61) which opens the inline drawer modal. Fill in the fields and submit.
*   **Handler Called:** Form action calls `handleAddStock` (line 34 in `page.tsx`) which executes server action `addStock` in [app/actions/inventory.ts:L18](file:///c:/Users/171106/Downloads/game/app/actions/inventory.ts#L18).
*   **Database Query executed:**
    ```typescript
    const { error } = await supabase.from('stocks').insert({
      category,
      sku: finalSku,
      name,
      capital_price,
      post_price,
      current_price: post_price,
      login_info,
      status: 'Tersedia',
      managed_by: user?.id || null
    })
    ```
*   **Validations & Security Checks:** Checks that `category` and `name` are provided. Resolves user from `auth.getUser()`. If insert returns unique SKU violation (code `23505`), it throws a customized error.
*   **UI Updates:** Closes the drawer (`setIsAddStockOpen(false)`), reloads the list via `loadInventory()`, and revalidates cache.

### 5.2. Catat Pembelian Stok Baru
*   **Trigger:** Click on `Catat Pembelian Baru` button in [app/dashboard/purchases/page.tsx:L138](file:///c:/Users/171106/Downloads/game/app/dashboard/purchases/page.tsx#L138). Fill the form and submit.
*   **Handler Called:** Form `onSubmit` calls `handleAddPurchase` (line 50 in `page.tsx`) which calls server action `purchaseStock` in [actions/purchases.ts:L7](file:///c:/Users/171106/Downloads/game/actions/purchases.ts#L7).
*   **Database Query executed:**
    Calls database RPC function `process_stock_purchase`:
    ```typescript
    const { data: stockId, error } = await supabase.rpc('process_stock_purchase', {
      p_category: data.category,
      p_name: data.name,
      p_account_details: data.account_details || null,
      p_username: data.username || null,
      p_password: data.password || null,
      p_capital_price: data.capital_price,
      p_post_price: data.post_price,
      p_current_price: data.current_price,
      p_seller_info: data.seller_info || null,
      p_internal_notes: data.internal_notes || null,
      p_purchase_payment_status: data.purchase_payment_status,
      p_payment_account_id: data.payment_account_id || null,
      p_admin_id: adminId
    })
    ```
*   **Validations & Security Checks:** Verifies admin session. If status is `LUNAS`, requires target payment account ID.
*   **UI Updates:** Closes drawer (`setIsAddOpen(false)`) and refreshes table via `loadData()`.
*   **Mismatch/Bug:** CRITICAL FAILURE. The database function `process_stock_purchase` fails at runtime because the columns `admin_id`, `purchase_payment_status`, `payment_account_id` do not exist in the `stocks` table schema. It also attempts to insert into `finance_ledger` with columns `stock_id` and `admin_id` which are non-existent.

### 5.3. Buat Deal Penjualan Baru
*   **Trigger:** Click on `Buat Deal Baru` button in [app/dashboard/deals/page.tsx:L73](file:///c:/Users/171106/Downloads/game/app/dashboard/deals/page.tsx#L73). Fill in the form and submit.
*   **Handler Called:** Form action calls `handleAddDeal` (line 46 in `page.tsx`) which calls server action `createPenjualan` in [app/actions/deals.ts:L28](file:///c:/Users/171106/Downloads/game/app/actions/deals.ts#L28).
*   **Database Query executed:**
    1. Checks if customer exists: `supabase.from('customers').select('id').eq('name', customer_name)`
    2. Inserts customer if missing: `supabase.from('customers').insert(...)`
    3. Inserts deal record (using status `'DRAFT'`):
       ```typescript
       await supabase.from('deals').insert({
         deal_number: dealNumber,
         customer_id: customerId,
         deal_type: 'Penjualan',
         total_deal_price: price,
         total_paid: 0,
         status: 'DRAFT',
         handled_by: user.id
       })
       ```
    4. Inserts deal item relation: `supabase.from('deal_items').insert({ deal_id, stock_id, price })`
    5. If initial payment exists, calls RPC `process_payment`:
       ```typescript
       await supabase.rpc('process_payment', { p_deal_id, p_account_id, p_amount, p_notes, p_admin_id })
       ```
       Otherwise, updates stock status directly to `'BOOKED'`:
       ```typescript
       await supabase.from('stocks').update({ status: 'BOOKED' }).eq('id', stock_id)
       ```
*   **Validations & Security Checks:** Checks that customer name, stock, and price are provided. Verifies admin session.
*   **UI Updates:** Closes drawer and reloads UI state.
*   **Mismatch/Bug:** CRITICAL FAILURE.
    *   Inserting status `'DRAFT'` violates `deals` CHECK constraint (which only allows `'Draft'`).
    *   Updating stock status to `'BOOKED'` violates `stocks` CHECK constraint (which only allows `'Booking'`).
    *   The SQL function `process_payment` is completely broken: it refers to non-existent columns like `payments.admin_id`, `finance_ledger.deal_id`, `finance_ledger.payment_id`, `finance_ledger.stock_id`, `finance_ledger.description`, `finance_ledger.admin_id`, `deals.remaining_balance`, `deals.payment_percentage`, and sets enums `'PAID'`, `'LIMITED_ACCESS'`, etc. that fail database check constraints.

### 5.4. Buat Transaksi Tukar Tambah Baru
*   **Trigger:** Click on `Buat Transaksi TT` in [app/dashboard/trade-in/page.tsx:L79](file:///c:/Users/171106/Downloads/game/app/dashboard/trade-in/page.tsx#L79). Fill in the form and submit.
*   **Handler Called:** Form action calls `handleAddTT` (line 50 in `page.tsx`) which calls server action `createTukarTambah` in [app/actions/trade-in.ts:L32](file:///c:/Users/171106/Downloads/game/app/actions/trade-in.ts#L32).
*   **Database Query executed:**
    1. Resolves/inserts customer (SELECT/INSERT).
    2. Inserts deal record with status `'DRAFT'`, `'BOOKED'`, `'LIMITED_ACCESS'`, or `'PAID'`:
       ```typescript
       await supabase.from('deals').insert({ deal_number, customer_id, deal_type: 'Tukar Tambah', total_deal_price: price_out, total_paid: tt_value, status, handled_by: user.id })
       ```
    3. Inserts relations in `deal_items` and `trade_in_items`.
    4. Updates outgoing stock.
    5. If cashback is paid out, inserts into `payments` (type: `'OUT'`), inserts into `finance_ledger` (type: `'PAYMENT_OUT'`), and updates `accounts` balance.
*   **Validations & Security Checks:** Requires customer name, stock, prices, and trade-in asset details. Requires account if cash changes hands.
*   **UI Updates:** Closes drawer and reloads page data.
*   **Mismatch/Bug:** CRITICAL FAILURE.
    *   Attempts to update `stocks` table with non-existent columns `sold_date` and `booking_date`.
    *   Inserts `'OUT'` for `payments.payment_type` (fails CHECK constraint).
    *   Inserts `'PAYMENT_OUT'` for `finance_ledger.transaction_type` (fails CHECK constraint).
    *   Inserts uppercase enums like `'PAID'`, `'SOLD'` (fails CHECK constraints).
    *   Invokes the broken `process_payment` RPC.

### 5.5. Tambah Rekening Baru
*   **Trigger:** Click on `Tambah Rekening` button in [app/dashboard/accounts/page.tsx:L94](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx#L94). Fill in details and submit.
*   **Handler Called:** Form action calls `handleAddAccount` (line 35 in `page.tsx`) which calls server action `addAccount` in [app/actions/accounts.ts:L18](file:///c:/Users/171106/Downloads/game/app/actions/accounts.ts#L18).
*   **Database Query executed:**
    ```typescript
    await supabase.from('accounts').insert({
      name,
      type,
      account_number,
      balance: 0,
      is_active: true
    })
    ```
*   **Validations & Security Checks:** Verifies name and type are filled.
*   **UI Updates:** Closes drawer and reloads accounts via `loadAccounts()`.

### 5.6. Mutasi Saldo (Transfer Antar Rekening)
*   **Trigger:** Click on `Mutasi Saldo` in [app/dashboard/accounts/page.tsx:L87](file:///c:/Users/171106/Downloads/game/app/dashboard/accounts/page.tsx#L87). Select source/dest accounts, enter amount, and submit.
*   **Handler Called:** Form action calls `handleMutasi` (line 49 in `page.tsx`) which calls server action `transferBalance` in [app/actions/accounts.ts:L45](file:///c:/Users/171106/Downloads/game/app/actions/accounts.ts#L45).
*   **Database Query executed:**
    Calls database RPC function `process_account_transfer`:
    ```typescript
    await supabase.rpc('process_account_transfer', {
      p_source_account_id: from_account_id,
      p_dest_account_id: to_account_id,
      p_amount: amount,
      p_admin_fee: 0,
      p_admin_id: user.id
    })
    ```
*   **Validations & Security Checks:** Checks that source and destination are different, amount is positive, and admin session is active.
*   **UI Updates:** Closes drawer and reloads accounts.
*   **Mismatch/Bug:** CRITICAL FAILURE. The RPC function `process_account_transfer` is broken. It attempts to insert into `finance_ledger` with columns `description` (should be `notes`) and `admin_id` (should be `created_by`). It also inserts `transaction_type` values `'TRANSFER_OUT'` and `'TRANSFER_IN'`, which violate the check constraint on `finance_ledger.transaction_type`.

### 5.7. Buat Problem Case Baru
*   **Trigger:** Click on `Buat Case Baru` in [app/dashboard/problem-cases/page.tsx:L65](file:///c:/Users/171106/Downloads/game/app/dashboard/problem-cases/page.tsx#L65). Fill details and submit.
*   **Handler Called:** Form action calls `handleAddCase` (line 42 in `page.tsx`) which calls server action `createProblemCase` in [app/actions/problem-cases.ts:L25](file:///c:/Users/171106/Downloads/game/app/actions/problem-cases.ts#L25).
*   **Database Query executed:**
    1. SELECT latest case number.
    2. INSERT into `problem_cases` table:
       ```typescript
       await supabase.from('problem_cases').insert([payload])
       ```
    3. INSERT into `audit_logs` table:
       ```typescript
       await supabase.from('audit_logs').insert([{
         user_id: userData.user.id,
         module: 'Akun Bermasalah',
         action: 'CREATE',
         description: `Membuat tiket problem case baru: ${case_number} (${issue_type})`
       }])
       ```
*   **Validations & Security Checks:** Issue type must be provided.
*   **UI Updates:** Closes modal and refreshes data list.
*   **Mismatch/Bug:** CRITICAL FAILURE. While the `problem_cases` insert works, the subsequent insert into `audit_logs` fails with a foreign key constraint violation. The logged-in user is not present in the `public.users` table, which is currently completely empty and lacks triggers to sync from `auth.users`.

---

## 6. END-TO-END REALTIME VERIFICATION
An end-to-end test was performed to verify if database modifications propagate to other open tabs in real-time.
*   **Test Setup:** Open 2 browser tabs of the dashboard simultaneously. Perform a direct data change on the `accounts` or `stocks` table in Tab 1 or via Supabase Studio.
*   **Observation:** The second tab **DOES NOT** update automatically. A manual page refresh is required to display the changes.
*   **Reason:** Real-time database subscription is **not implemented** anywhere in the code. All data loading is performed via server actions called once inside React `useEffect` hooks on page load. There is no active `.channel().on('postgres_changes', ...)` listening to changes.

---

## 7. SECURITY — ACTUAL IMPLEMENTATION

### 7.1. Service Role Key Exposure
*   **Findings:** The `SUPABASE_SERVICE_ROLE_KEY` is present in the server-side environment file `.env.local` and is read in `lib/supabase/admin.ts` to instantiate a Supabase admin client. This client is imported dynamically in `actions/settings.ts` in `deleteGameCategory`.
*   **Risk:** While this key is executed strictly on the server and is not bundled into the client-side code, its presence on the Next.js server workspace violates the strict ecosystem-wide guardrail specified in [AI_GUARDRAILS.md:L84](file:///c:/Users/171106/Downloads/game/AI_GUARDRAILS.md#L84):
    > *`SUPABASE_SERVICE_ROLE_KEY` DILARANG KERAS ada di environment variable, kode, atau bundle frontend repo feryshop-webmail, dashboard-admin, maupun web-public. Key ini HANYA boleh hidup di: (a) Supabase Edge Function, (b) imap-worker di VPS.*
*   **Recommendation:** **Flagged as a CRITICAL FINDING.** The delete action and all other admin actions requiring RLS bypass must be delegated to a Supabase Edge Function rather than being run on the Next.js server with the service role key.

### 7.2. Edge Functions Deployment Status
*   **Findings:** Querying the Supabase project configuration returned `{"functions":[]}`. There are **zero** Edge Functions created, configured, or deployed on the Supabase project. The `supabase/` folder in the repository contains no source code for edge functions.

### 7.3. Unauthenticated Route Vulnerability
*   **Findings:** The main page `/dashboard` correctly redirects unauthenticated sessions to `/login`. However, all client-side pages under `/dashboard/*` (such as `/dashboard/inventory`, `/dashboard/deals`, `/dashboard/accounts`, etc.) are React Client Components (`"use client"`) that contain no route guards or redirects.
*   **Risk:** An unauthenticated user can visit these pages directly. The pages will load the UI shell, sidebar, and layout, and will display empty lists or error messages because the underlying server actions fail under RLS policies. The application lacks a global middleware or layout-level session check to force redirects to `/login`.

---

## 8. ACTUALLY USED ENVIRONMENT VARIABLES
The following environment variables are read by the application:
*   `NEXT_PUBLIC_SUPABASE_URL` (Used in client-side and server-side client builders)
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Used in client-side and server-side client builders)
*   `SUPABASE_SERVICE_ROLE_KEY` (Used in `lib/supabase/admin.ts` to build the bypass client)

---

## 9. GAPS & LIMITATIONS (MUST BE HONEST)

1.  **Broken Database Functions (RPCs):** The postgres functions `process_stock_purchase`, `process_payment`, and `process_account_transfer` refer to non-existent columns (`stocks.admin_id`, `stocks.purchase_payment_status`, `stocks.payment_account_id`, `finance_ledger.stock_id`, `finance_ledger.admin_id`, `finance_ledger.description`, `deals.remaining_balance`, `deals.payment_percentage`) and will fail with syntax/column/constraint errors when invoked.
2.  **CHECK Constraint Enums Mismatches:** The Next.js Server Actions attempt to set statuses like `'DRAFT'`, `'BOOKED'`, `'PAID'`, `'LIMITED_ACCESS'`, and `'SOLD'` in uppercase. However, the database check constraints only accept capitalized Indonesian strings like `'Draft'`, `'Booking'`, `'Lunas'`, `'Akses Terbatas'`, and `'Terjual'`, causing mutations to fail.
3.  **Missing User Synchronization:** The `public.users` table has 0 rows and has no triggers to copy authenticated accounts from `auth.users`. Any server action that inserts into tables referencing `public.users.id` (such as `audit_logs` and `deals`) fails due to foreign key violations.
4.  **100% Mocked/Dummy Pages:**
    *   **FerryMail Inbox:** All emails, senders, and OTP codes are randomly generated in the client-side state. It does not load data from the `incoming_emails` table.
    *   **System Settings:** The management of users and game categories is static mock data. Changes cannot be saved to the database.
    *   **Promosi Templates:** The templates are mock constants.
5.  **Dangling/Obsolete Code Base:** The root-level `actions/` folder (containing actions like `actions/stocks.ts`, `actions/deals.ts`) and several directories in `components/` (like `components/inventory/`, `components/deals/`, `components/accounts/`) are unused remnants of an earlier client-component architecture. They have been replaced by inline pages under `app/dashboard/` and server actions in `app/actions/`.
6.  **Real-Time Data Missing:** The project has no realtime subscriptions (`.channel().on(...)`) and relies strictly on fetching data once on load.
7.  **Search & Filtering UI Bugs:** Search inputs in the Inventory and Deals pages are not wired to filter the state array, making them purely visual placeholders. Category and status dropdown filters are mostly unclickable or non-functional.
8.  **Empty Seed Data:** The database has zero rows for all tables (except one row in `public_users`), leaving the dashboard completely empty. The `seed.ts` script is also broken due to schema column mismatches and cannot be run.

---

## 10. ACTUAL FOLDER STRUCTURE

```
c:\Users\171106\Downloads\game\
├── actions/
│   ├── accounts.ts
│   ├── analytics.ts
│   ├── auth.ts
│   ├── deals.ts
│   ├── inventory.ts
│   ├── ledger.ts
│   ├── logout.ts
│   ├── purchases.ts
│   ├── settings.ts
│   ├── stocks.ts
│   └── upload.ts
├── app/
│   ├── actions/
│   │   ├── accounts.ts
│   │   ├── audit-log.ts
│   │   ├── deals.ts
│   │   ├── inventory.ts
│   │   ├── ledger.ts
│   │   ├── problem-cases.ts
│   │   ├── reports.ts
│   │   └── trade-in.ts
│   ├── dashboard/
│   │   ├── accounts/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── audit-log/
│   │   │   └── page.tsx
│   │   ├── deals/
│   │   │   └── page.tsx
│   │   ├── ferrymail/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   ├── category/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── ledger/
│   │   │   └── page.tsx
│   │   ├── problem-cases/
│   │   │   └── page.tsx
│   │   ├── purchases/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   ├── cashflow/
│   │   │   │   └── page.tsx
│   │   │   └── profit-loss/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── templates/
│   │   │   └── page.tsx
│   │   ├── trade-in/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── accounts/
│   │   ├── AccountsClient.tsx
│   │   ├── AddAccountModal.tsx
│   │   └── TransferFundsModal.tsx
│   ├── deals/
│   │   ├── AddPaymentModal.tsx
│   │   ├── CreateDealModal.tsx
│   │   ├── DealTable.tsx
│   │   └── DealsHeaderActions.tsx
│   ├── features/
│   ├── img/
│   ├── inventory/
│   │   ├── AddStockModal.tsx
│   │   ├── EditStockModal.tsx
│   │   ├── StockRowActions.tsx
│   │   ├── StockTable.tsx
│   │   └── ViewStockModal.tsx
│   ├── layout/
│   │   └── Sidebar.tsx
│   ├── ledger/
│   ├── purchases/
│   └── ui/
│       └── StatusBadge.tsx
├── lib/
│   ├── supabase/
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   └── server.ts
│   ├── schemas.ts
│   └── utils.ts
├── public/
│   └── img/
│       └── rekening/
│           ├── DANA.webp
│           ├── GOPAY.webp
│           ├── MANDIRI.webp
│           ├── OVO.webp
│           ├── QRIS.webp
│           └── SEABANK.webp
├── scripts/
│   ├── delete_jago.ts
│   ├── inject_accounts.ts
│   └── seed.ts
├── supabase/
│   ├── migrations/
│   │   ├── 0000_feryshop_mvp_init.sql
│   │   ├── 0001_feryshop_transaction_rpc.sql
│   │   ├── 0002_feryshop_stock_purchase.sql
│   │   ├── 0003_feryshop_account_transfer.sql
│   │   ├── 0004_feryshop_stock_images.sql
│   │   └── 0005_feryshop_game_images.sql
│   └── schema_draft.sql
├── types/
│   ├── database.ts
│   └── database.types.ts
├── AGENTS.md
├── AI_GUARDRAILS.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prd.md
├── tsconfig.json
└── README.md
```
