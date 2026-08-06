# Feryshop Dashboard Admin

Sistem Dashboard Admin (SaaS ERP) untuk mengelola inventori, transaksi jual beli akun game, tukar tambah, dan pembukuan kas. Dibangun dengan Next.js 15 (App Router), TailwindCSS, dan Supabase.

## Tech Stack
- **Framework:** Next.js 15 (React 19) dengan App Router & Server Actions
- **Styling:** TailwindCSS (Minimalist, Clean "BantuSellerFin" aesthetic)
- **Icons:** Lucide React
- **Database & Auth:** Supabase (PostgreSQL dengan Row Level Security)
- **Language:** TypeScript (Strict mode)

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
   Jalankan query SQL yang ada di file `supabase/schema_draft.sql` ke Supabase SQL Editor Anda untuk membuat struktur tabel, trigger, enum, dan kebijakan (RLS).
   Perubahan bertahap setelah draft awal disimpan di `supabase/migrations/`.
   `0008_storefront_remote_settings.sql` menambahkan tabel `public.settings`
   sebagai remote config dinamis untuk FS-Public. Tabel ini memakai `JSONB`
   per key, RLS public read untuk client storefront, dan write tetap melalui
   jalur server/admin.

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Modul Utama
- `/dashboard` - Pusat metrik (Omzet, Profit, Piutang)
- `/dashboard/deals` - Manajemen Transaksi Jual Beli
- `/dashboard/trade-in` - Modul Tukar Tambah (Trade-In)
- `/dashboard/inventory` - Manajemen Stok Aset & Akun
- `/dashboard/purchases` - Modul Kulakan / Pembelian Stok
- `/dashboard/accounts` - Manajemen Akun Keuangan (Bank/E-Wallet)
- `/dashboard/ledger` - Buku Kas (Pemasukan/Pengeluaran Operasional)
- `/dashboard/reports/*` - Laporan Finansial (Laba Rugi, Cashflow)
- `/dashboard/problem-cases` - Tiket & Komplain (Akun Bermasalah)
- `/dashboard/audit-log` - Log Aktivitas Admin (Read-only)

## Panduan Transaksi & Relasi Data (Strict ERP Pattern)
- **Tukar Tambah (Trade-in):** Merupakan gabungan dari Deal Pembelian (Aset Masuk) dan Penjualan (Aset Keluar). Semua transaksi dikaitkan satu sama lain di tabel `deal_items` dan termutasi ke dalam `finance_ledger` secara seimbang.
- **Pembayaran (Split Payments):** Satu Deal dapat dibayar melalui beberapa akun bank secara mencicil (Booking/DP -> Lunas). Piutang terhitung secara otomatis berdasar selisih `total_deal_price` dengan akumulasi payments.

## Batasan Scope vs Storefront (FS-Public)

Repo ini adalah **admin ERP** (internal). **Tidak ada integrasi payment gateway** di sini — pembayaran diselesaikan eksternal (transfer bank / e-wallet, biasanya dikoordinasikan via WhatsApp) dan hanya *dicatat* oleh admin ke dalam sistem.

Penyajian metode pembayaran untuk pelanggan (kode/QR QRIS, e-wallet, transfer) dan status order/pembayaran ada di repo **`FS-Public`** (storefront). Kedua repo berbagi satu database Supabase.

---
_Dikembangkan dengan Zero-Hallucination Vibe Coding Principles._
