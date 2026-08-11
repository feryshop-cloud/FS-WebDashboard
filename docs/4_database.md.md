# PRD: Database Schema & Supabase Architecture

## 1. Database Philosophy
Sistem ini menggunakan Supabase (PostgreSQL) sebagai penyimpanan data utama. Struktur relasional dioptimalkan untuk integritas data yang ketat (Strict ERP Pattern) menggunakan foreign keys, checks, dan constraints. Data keuangan dilacak secara double-entry dan audit trail merekam seluruh aktivitas penting secara immutable.

## 2. Authentication & Role-Based Access Control (RBAC)
Kami menggunakan Supabase Auth terintegrasi dengan tabel manajemen hak akses kustom untuk memisahkan wewenang admin operasional (`ADMIN`) dan pemilik bisnis (`OWNER`).

### Skema Tabel RBAC:
* **`roles`**: Menyimpan nama role kustom (misal: `OWNER`, `ADMIN`, `FINANCE`).
* **`users`**: Menghubungkan metadata admin (nama lengkap, role, status aktif) ke `auth.users` Supabase.
* **`permissions`**: Izin aksi granular per modul.
* **`role_permissions`**: Mapping relasi perizinan antara `roles` dan `permissions`.

---

## 3. Tabel Utama & Relasi

### A. Modul Inventori / Game
* **`categories`**: Menyimpan kategori game (contoh: "Mobile Legends", "Free Fire").
* **`stocks`**: Menyimpan data akun game (menggantikan draft `inventory`).
  - Kolom kunci: `id`, `category_id`, `name`, `account_details`, `username`, `password`, `capital_price` (modal), `post_price`, `current_price`, `status`, `seller_info`, `admin_id`.
  - Status enum: `AVAILABLE` (Tersedia), `BOOKED` (Booking), `RESTRICTED` (Akses Terbatas), `SOLD` (Terjual), `ON_HOLD`, `PROBLEM_PENDING`, `PROBLEM_PERMANENT`, `CANCELLED`.
* **`stock_histories`**: Log mutasi perubahan status stok untuk audit riwayat kepemilikan.

### B. Modul Transaksi & Tukar Tambah
* **`customers`**: Menyimpan profil pelanggan (nama, nomor telepon WhatsApp).
* **`deals`**: Mencatat transaksi penjualan utama.
  - Tipe deal: `Penjualan`, `Tukar Tambah`.
  - Status deal: `DRAFT`, `BOOKING`, `RESTRICTED`, `LUNAS`, `CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_SHOP`, `REFUND_PARTIAL`, `REFUND_FULL`, `PROBLEM`, `DONE`.
* **`deal_items`**: Menghubungkan deal dengan item stok yang terjual.
* **`trade_in_items`**: Menampung data akun dari customer yang masuk sebagai aset barter dalam transaksi tukar tambah.

### C. Modul Keuangan & Ledger
* **`accounts`**: Menyimpan akun/metode pembayaran resmi (kas, bank, e-wallet).
* **`payments`**: Mencatat cicilan/pembayaran dari customer yang terikat ke suatu deal.
* **`finance_ledger`**: Buku kas umum untuk setiap mutasi uang keluar/masuk.
  - Tipe transaksi: `PAYMENT_IN`, `PAYMENT_OUT`, `STOCK_PURCHASE`, `REFUND`, `CASHBACK`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`.
* **`balance_adjustments`**: Request penyesuaian saldo manual oleh staf yang membutuhkan approval Owner.

### D. Modul Operasional & Lainnya
* **`problem_cases`**: Tiket penanganan jika akun bermasalah pasca penjualan atau tukar tambah.
* **`email_accounts` & `incoming_emails`**: Integrasi FerryMail untuk menarik dan membaca OTP/pesan masuk ke akun email game.
* **`audit_logs`**: Log tidak dapat diubah (immutable) yang mencatat log masuk, view data sensitif, ekspor, dan mutasi data oleh admin.
* **`topup_products` & `orders`**: Integrasi sinkronisasi produk/pesanan top-up.

---

## 4. Supabase Storage (Buckets)
* **Bucket `account-screenshots`**: Menyimpan screenshot spek akun game. Bersifat public-read untuk render UI di dashboard, tetapi upload dibatasi bagi admin terautentikasi.

## 5. Row Level Security (RLS) & Column-Level Security
* Semua tabel wajib mengaktifkan RLS.
* Penggunaan `SUPABASE_SERVICE_ROLE_KEY` pada frontend/workspace Next.js dinonaktifkan sepenuhnya demi alasan keamanan.
* Operasi read/write dilakukan melalui anon-key dengan validasi session RLS atau fungsi PostgreSQL RPC bertanda `SECURITY DEFINER` (misal: `process_payment`, `process_stock_purchase`, dan `process_account_transfer`).
* Akses data sensitif keuangan seperti modal (`capital_price`) dan profit pada tingkat server action dibatasi hanya bagi admin dengan role `OWNER`/`SUPER_ADMIN`.