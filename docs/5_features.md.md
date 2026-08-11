# PRD: Core Features & Modules

## 1. Authentication & RBAC Module
* **Login Page**: Layar masuk minimalis dengan validasi kredensial dan notifikasi toast.
* **Role-Based Access Control**: Pembagian akses dinamis berdasarkan role (`OWNER` vs `ADMIN`).
* **Session Management**: Session ditangani secara aman via Next.js Middleware untuk memproteksi rute `/dashboard/*`.

## 2. Command Center Dashboard Module
Landing page utama yang menampilkan visualisasi data berdasarkan kewenangan role pengguna:
* **Super Admin / Owner View**:
  - Kartu Metrik Utama: Omzet Penjualan, Profit Bersih, Total Piutang Aktif, dan Total Modal Stok yang beredar.
  - Donut Chart Inventori: Visualisasi status stok secara proporsional riil (Tersedia, Booking, Akses Terbatas, Terjual, On Hold, Bermasalah, Cancel).
  - Grafik Tren Keuangan: Dual AreaChart (`recharts`) yang memetakan statistik Pendapatan (Revenue) vs Laba Bersih (Profit) selama 30 hari terakhir.
  - Panel Recent Transactions: Kartu interaktif yang menyajikan 7 transaksi terakhir di ledger dengan link cerdas ke detail entitas terkait.
* **Admin / Warehouse View**:
  - Membatasi akses sehingga tidak menampilkan metrik keuangan apa pun. Hanya menyajikan metrik operasional (Tugas Pending, Stok Tersedia, dan Stok Terjual).

## 3. Inventory & Stock Management Module
* **Data Table Stok**: Dilengkapi pencarian kode referensi/nama akun, filter kategori game, filter status stok, dan paginasi terintegrasi.
* **Ingestion Stok (Slide-out Sheet)**: Input kategori game, upload screenshot spek, kode referensi internal, spesifikasi akun (JSONB/Text), harga modal, harga posting, dan catatan internal.
* **Row-Level Actions**:
  - Detail/Edit stok.
  - Generate Caption (menyalin caption promosi siap pakai).
  - Mark as Sold (mengalihkan status stok ke SOLD dengan input nominal terjual riil).
  - Kelola Problem (melaporkan kendala akun).

## 4. Deals & Split Payments Module
* **Manajemen Deal**: Mendukung transaksi penjualan standar maupun tukar tambah.
* **Split Payments**: Satu deal mendukung beberapa pembayaran cicilan (DP -> Cicilan -> Pelunasan). Menghitung secara otomatis sisa pembayaran (piutang) dan persentase pembayaran.
* **Invoice/Nota**: Menghasilkan nota resmi yang dapat diunduh dalam format PDF/Excel.
* **Refund/Cancellation Flow**: Membatalkan deal dengan pengembalian dana penuh atau pemotongan dana hangus sesuai kebijakan.

## 5. Trade-In (Tukar Tambah) Module
* **Alur Barter**: Mendukung penukaran satu atau lebih akun milik customer dengan akun stok Feryshop.
* **Penilaian Aset**: Nilai taksiran akun customer dicatat sebagai aset masuk baru, dan selisihnya diselesaikan dengan tambahan uang masuk (pemasukan) atau cashback (pengeluaran).

## 6. Cashbook & Ledger Management Module
* **Accounts/Metode Pembayaran**: Pengelolaan dompet digital, rekening bank, dan channel reseller.
* **Buku Kas/Ledger**: Pencatatan mutasi kas secara riil, baik transaksi otomatis (penjualan, pembelian stok, refund) maupun transaksi manual (pengeluaran operasional, transfer antar-rekening, admin fee).

## 7. Ticketing Problem Cases Module
* Layanan pelaporan dispute pasca-transaksi untuk akun yang bermasalah.
* Menyimpan kronologi tindakan penyelesaian, biaya perbaikan, opsi refund, dan update status akhir.

## 8. FerryMail Module (Surel Integrasi)
* Halaman kotak masuk surel (inbox) yang menampilkan email masuk untuk mempermudah admin/staff dalam mengecek kode verifikasi (OTP) dari game tanpa perlu membuka webmail eksternal.

## 9. Reports & Export Module
* **Laporan Finansial**: Laporan Laba Rugi (Profit & Loss) dan Laporan Arus Kas (Cashflow).
* **Fitur Paginasi & Filter**: Filter tanggal, filter akun bank, dan pagination tabel laporan.
* **Export Data**: Mendukung ekspor instan seluruh data laporan ke format CSV dan Excel (`/api/export/*`).

## 10. Audit Log Module
* Log rekam jejak aktivitas staf bersifat read-only untuk memantau aktivitas sensitif (login, perubahan role, ekspor laporan, pembuatan deal, penyesuaian saldo rekening).