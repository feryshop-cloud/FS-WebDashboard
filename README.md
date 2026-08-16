# Feryshop Dashboard Admin (ERP)

Sistem Dashboard Admin (SaaS ERP) untuk mengelola inventori, transaksi jual beli akun game, tukar tambah, dan pembukuan kas. Dibangun dengan **Next.js 16** (App Router), TailwindCSS v4, dan Supabase.

## Tech Stack

- **Framework:** Next.js 16 (React 19) dengan App Router & Server Actions
- **Styling:** TailwindCSS v4 (design system "BantuSellerFin" — palet slate, shadow, radius)
- **Icons:** Lucide React
- **Database & Auth:** Supabase (PostgreSQL dengan Row Level Security)
- **Language:** TypeScript (Strict mode)
- **Vector Search:** pgvector + `vector-worker` (Cloudflare Worker + Railway service) untuk pencarian inventori berbasis embedding

## Prerequisites

- Node.js >= 20.x
- npm / pnpm / yarn
- Proyek Supabase aktif

## Panduan Instalasi & Menjalankan Project

1. **Clone & Install Dependencies**
   ```bash
   npm install
   # atau
   pnpm install
   ```

2. **Setup Environment Variables**
   Buat file `.env.local` di root directory. Isikan dengan:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   > **PERINGATAN (SECURITY ALERT):**
   > Jangan pernah memasukkan `service_role_key` ke dalam `.env.local` frontend. Semua operasi CRUD menggunakan `anon_key` yang akan diamankan oleh RLS (Row Level Security) Postgres, atau dikendalikan melalui RPC `SECURITY DEFINER` khusus untuk mutasi yang aman.

3. **Setup Database (Supabase)**
   Jalankan migrasi SQL yang ada di `supabase/migrations/` secara berurutan ke Supabase SQL Editor Anda untuk membuat struktur tabel, enum, trigger, dan kebijakan (RLS).
   Skema awal juga tersedia di `supabase/schema_draft.sql` untuk referensi.

   Komponen penting yang harus aktif:
   - Tabel operasional (`inventory`, `stocks`, `deals`, `payments`, `finance_ledger`, `accounts`, dst.)
   - RLS policies (`is_admin()` untuk admin, column-level security untuk `inventory`)
   - Trigger `inventory_vector_worker_webhook_trigger` untuk sinkronisasi vector search
   - RPC `create_inventory_vector` dan `backfill_inventory_vectors` untuk vector embedding

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Modul Utama

- `/dashboard` - Pusat metrik (Omzet, Profit, Piutang)
- `/dashboard/deals` - Manajemen Transaksi Jual Beli
- `/dashboard/trade-in` - Modul Tukar Tambah (Trade-In)
- `/dashboard/inventory` - Manajemen Stok Aset & Akun + Vector Search
- `/dashboard/purchases` - Modul Kulakan / Pembelian Stok
- `/dashboard/accounts` - Manajemen Akun Keuangan (Bank/E-Wallet)
- `/dashboard/ledger` - Buku Kas (Pemasukan/Pengeluaran Operasional)
- `/dashboard/reports/*` - Laporan Finansial (Laba Rugi, Cashflow)
- `/dashboard/problem-cases` - Tiket & Komplain (Akun Bermasalah)
- `/dashboard/audit-log` - Log Aktivitas Admin (Read-only)

## Arsitektur Vector Search

Inventori menggunakan **vector search** berbasis embedding untuk pencarian akun game:

```text
INSERT/UPDATE inventory
    ↓
trigger: supabase_functions.http_request() [pg_net + HMAC signature]
    ↓
Cloudflare Worker (vector-worker)
    ↓
Cloudflare Queue: inventory-vector-queue
    ↓
RPC: create_inventory_vector(record_id)
    ↓
UPDATE inventory SET title_reference_vector = ...
```

- Trigger database menggunakan `pg_net` untuk mengirim webhook secara asynchronous ke `vector-worker`
- Worker menerima payload, verifikasi HMAC-SHA256 signature, lalu meng-enqueue record ID
- Queue consumer memanggil RPC `create_inventory_vector` untuk mengenerate/update vector embedding
- Cron harian (`backfill_inventory_vectors`) untuk reconcile record yang terlewat

## Panduan Transaksi & Relasi Data (Strict ERP Pattern)

- **Tukar Tambah (Trade-in):** Merupakan gabungan dari Deal Pembelian (Aset Masuk) dan Penjualan (Aset Keluar). Semua transaksi dikaitkan satu sama lain di tabel `deal_items` dan termutasi ke dalam `finance_ledger` secara seimbang.
- **Pembayaran (Split Payments):** Satu Deal dapat dibayar melalui beberapa akun bank secara mencicil (Booking/DP -> Lunas). Piutang terhitung secara otomatis berdasar selisih `total_deal_price` dengan akumulasi payments.

## Batasan Scope vs Storefront (FS-Public)

Repo ini adalah **admin ERP** (internal). **Tidak ada integrasi payment gateway** di sini — pembayaran diselesaikan eksternal (transfer bank / e-wallet, biasanya dikoordinasikan via WhatsApp) dan hanya *dicatat* oleh admin ke dalam sistem.

Penyajian metode pembayaran untuk pelanggan (kode/QR QRIS, e-wallet, transfer) dan status order/pembayaran ada di repo **`FS-Public`** (storefront). Kedua repo berbagi satu database Supabase.

## Commands

```bash
npm run dev                  # start dev server (http://localhost:3000)
npm run build                # production build
npm run start                # serve production build
npm run start:railway        # serve standalone di Railway (HOSTNAME=::)
npm run lint                 # ESLint
npm run format               # format codebase dengan Prettier
npm run create-admin         # bootstrap admin user
```

---

_Dikembangkan dengan Zero-Hallucination Vibe Coding Principles._

