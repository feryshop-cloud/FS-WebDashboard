# PRD: User Workflows & Application Logic

## 1. Workflow Philosophy
Aplikasi dirancang sebagai Single-Page Application (SPA) dinamis dengan integrasi Next.js Server Actions yang andal. Setiap aksi mutasi data yang berdampak pada saldo keuangan dan status stok dijalankan melalui transaksi database PostgreSQL atomik (Postgres RPC) demi menjaga konsistensi data dari risiko kegagalan parsial.

---

## 2. Alur Kerja Operasional Utama

### Alur Kerja A: Ingestion Stok Baru (Stok Masuk)
*Tujuan: Memasukkan akun game baru hasil akuisisi ke dalam inventori.*
1. Admin membuka menu **Inventory** dan mengklik **Add New Account**.
2. Staf mengunggah tangkapan layar (screenshot) spesifikasi akun (unggah langsung ke Railway S3 / Supabase Storage).
3. Staf mengisi detail game category, reference code, spesifikasi lengkap, harga modal, dan harga post.
4. Klik **Save**: Data divalidasi, disimpan ke tabel `stocks`, dan status default diatur menjadi `UNPOSTED`.

---

### Alur Kerja B: Caption & Publikasi Marketing
*Tujuan: Mempercepat promosi akun ke platform media sosial.*
1. Admin memfilter tabel stok untuk menampilkan item dengan status `UNPOSTED`.
2. Klik **Generate Caption** pada baris stok terpilih. Modal akan menampilkan caption yang telah diformat otomatis lengkap dengan spesifikasi akun dan emoji penarik perhatian.
3. Klik **Copy to Clipboard**.
4. Sistem menampilkan dialog konfirmasi: *"Caption berhasil disalin! Apakah ingin mengubah status stok menjadi AVAILABLE?"*
5. Jika staf memilih **Ya**, Server Action akan mengupdate status stok menjadi `AVAILABLE` secara real-time.

---

### Alur Kerja C: Transaksi Penjualan & Split Payments
*Tujuan: Memproses pembelian dari pelanggan secara lunas maupun bertahap.*
1. Admin membuat Deal Penjualan baru melalui menu **Deals**.
2. Staf menginput data pelanggan, harga deal yang disepakati, nominal pembayaran awal (DP), dan rekening bank tujuan transfer.
3. Klik **Submit**: Sistem mengeksekusi RPC `process_payment` secara atomik:
   - Membuat rekaman baru di tabel `payments`.
   - Mengubah status deal menjadi `BOOKING` atau `LUNAS` bergantung kecukupan nominal bayar.
   - Mengubah status stok menjadi `BOOKED` atau `SOLD`.
   - Menambahkan catatan uang masuk `PAYMENT_IN` di `finance_ledger`.
   - Menambahkan saldo di rekening bank penerima (`accounts`).
4. Jika pembayaran belum lunas, sisa pembayaran dicatat sebagai piutang, dan pembayaran berikutnya diinput pada deal yang sama.

---

### Alur Kerja D: Tukar Tambah (Trade-In)
*Tujuan: Memproses barter akun game lama milik customer dengan akun baru Feryshop.*
1. Staf membuat Deal Tukar Tambah.
2. Memilih stok Feryshop yang akan keluar (aset keluar).
3. Menginput spesifikasi dan nilai taksiran akun milik customer yang akan masuk (aset masuk). Akun customer didaftarkan secara otomatis sebagai item stok baru.
4. Menghitung nominal selisih:
   - Jika nilai taksiran customer < harga jual: Customer membayar sisa kekurangan transfer (uang masuk di ledger).
   - Jika nilai taksiran customer > harga jual: Feryshop memberikan cashback kepada customer (uang keluar di ledger).
5. Data keuangan masuk ke ledger keuangan secara seimbang tanpa mencampur nilai aset barter ke saldo rekening kas bisnis.

---

### Alur Kerja E: Kulakan / Pembelian Stok dari Supplier
*Tujuan: Membeli akun game dalam jumlah besar dari supplier secara lunas atau utang.*
1. Admin membuka menu **Purchases** dan mengisi formulir pembelian stok.
2. Mengisi harga modal pembelian dan memilih status pembayaran (`LUNAS` atau `PENDING` jika ditunda/utang).
3. Klik **Submit**: Sistem mengeksekusi RPC `process_stock_purchase`:
   - Jika `LUNAS`, saldo rekening kas terpotong, dan tercatat transaksi pengeluaran `STOCK_PURCHASE` di ledger keuangan.
   - Jika `PENDING`, transaksi dicatat sebagai kewajiban pembayaran tertunda.

---

### Alur Kerja F: Mutasi Saldo Kas Internal (Transfer Kas)
*Tujuan: Memindahkan dana bisnis antar rekening/metode pembayaran.*
1. Admin membuka menu **Ledger** dan mengklik **Transfer Antar Rekening**.
2. Memilih rekening asal, rekening tujuan, nominal transfer, dan biaya admin bank (jika ada).
3. Klik **Submit**: Sistem mengeksekusi RPC `process_account_transfer` secara atomik:
   - Saldo rekening asal dipotong (sebesar transfer + admin fee).
   - Saldo rekening tujuan ditambah.
   - Tercatat dua mutasi di ledger: `TRANSFER_OUT` dari rekening asal dan `TRANSFER_IN` ke rekening tujuan. Biaya admin dicatat sebagai biaya pengeluaran operasional.

---

### Alur Kerja G: Audit Finansial & Ekspor Laporan
*Tujuan: Managerial review kinerja keuangan bisnis oleh Owner.*
1. Owner membuka dashboard utama untuk memantau tren pendapatan dan laba bersih 30 hari terakhir.
2. Membuka menu **Reports** -> **Profit & Loss** atau **Cashflow** untuk memantau rekap harian/bulanan.
3. Melakukan filter berdasarkan rentang tanggal atau rekening tertentu.
4. Klik **Ekspor Laporan** untuk mengunduh laporan kas riil dalam format CSV/Excel untuk keperluan pembukuan eksternal.