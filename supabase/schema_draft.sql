-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS, ROLES & PERMISSIONS
-- ==========================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);


-- ==========================================
-- 2. CUSTOMERS & STOCKS
-- ==========================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL, -- e.g., STK-001
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_detail TEXT,
    login_info TEXT, -- username/email
    password_info TEXT,
    backup_code TEXT,
    capital_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    post_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Tersedia' 
      CHECK (status IN ('Tersedia', 'Booking', 'Akses Terbatas', 'Terjual', 'On Hold', 'Bermasalah - Ditindaklanjuti', 'Bermasalah - Permanen', 'Cancel')),
    purchase_date TIMESTAMP WITH TIME ZONE,
    seller_info TEXT,
    notes TEXT,
    managed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 3. TRANSACTIONS & DEALS
-- ==========================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., DL-2406-001
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    deal_type VARCHAR(50) DEFAULT 'Penjualan' CHECK (deal_type IN ('Penjualan', 'Tukar Tambah')),
    total_deal_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft' 
      CHECK (status IN ('Draft', 'Booking', 'Akses Terbatas', 'Lunas', 'Cancel oleh Pembeli', 'Cancel oleh Feryshop', 'Refund Sebagian', 'Refund Penuh', 'Bermasalah', 'Selesai')),
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    stock_id UUID REFERENCES stocks(id) ON DELETE RESTRICT,
    price NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trade_in_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    estimated_value NUMERIC(15, 2) NOT NULL,
    converted_to_stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 4. FINANCE & LEDGER
-- ==========================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- E-Wallet, Bank, dll
    account_number VARCHAR(100),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL 
      CHECK (payment_type IN ('DP', 'Cicilan', 'Pelunasan', 'Refund', 'Cashback TT', 'Pembelian Stok')),
    status VARCHAR(50) DEFAULT 'Selesai' CHECK (status IN ('Pending', 'Selesai', 'Bermasalah')),
    proof_url TEXT,
    notes TEXT,
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE finance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL 
      CHECK (transaction_type IN ('Mutasi Masuk', 'Mutasi Keluar', 'Pembayaran Masuk', 'Penyesuaian', 'Refund', 'Pengeluaran Operasional', 'Pembayaran Pembelian Stok')),
    amount NUMERIC(15, 2) NOT NULL, -- Positive for in, Negative for out
    ref_id VARCHAR(100), -- ID referensi (Payment ID, Deal ID, dll)
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 5. OPERATIONS & AUDIT
-- ==========================================
CREATE TABLE problem_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Open' 
      CHECK (status IN ('Open', 'Ditindaklanjuti', 'Menunggu Customer', 'Menunggu Pihak Ketiga', 'Selesai', 'Tidak bisa diselesaikan', 'Permanen', 'Refund', 'Cancel')),
    chronology TEXT,
    resolution TEXT,
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    record_id UUID, -- ID data terkait (flexible)
    old_data JSONB,
    new_data JSONB,
    description TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- 6. SECURITY & ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_in_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Default Deny All except for Authenticated Admin logic
-- (In production, these would be heavily refined using `auth.uid()` and `users.role_id`)
CREATE POLICY "Allow authenticated read access" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON stocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON deals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON finance_ledger FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Additional insert/update policies require function checks for specific role permissions

