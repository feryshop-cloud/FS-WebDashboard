-- ==========================================
-- Migration: Create Gmail Accounts and Status Logs
-- Description: Fitur Inventori Akun Google dan Audit Trail Pemantauan Status
-- ==========================================

-- 1. Tabel Utama: gmail_accounts
CREATE TABLE IF NOT EXISTS public.gmail_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    google_password TEXT,
    backup_codes TEXT,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum diamankan'
        CHECK (status IN (
            'Belum diamankan',
            'Diproses',
            'Dipakai sementara',
            'Stok Permanen',
            'Diserahkan ke Customer',
            'Bermasalah',
            'Non Aktif'
        )),
    managed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk pencarian & filtering
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_status ON public.gmail_accounts (status);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_email ON public.gmail_accounts (email);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_managed_by ON public.gmail_accounts (managed_by);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_created_at ON public.gmail_accounts (created_at DESC);

-- Enable RLS
ALTER TABLE public.gmail_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail_accounts_admin_access"
    ON public.gmail_accounts
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Tabel Audit: gmail_account_status_logs
CREATE TABLE IF NOT EXISTS public.gmail_account_status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.gmail_accounts(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk audit history
CREATE INDEX IF NOT EXISTS idx_gmail_status_logs_account_id ON public.gmail_account_status_logs (account_id);
CREATE INDEX IF NOT EXISTS idx_gmail_status_logs_created_at ON public.gmail_account_status_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.gmail_account_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gmail_account_status_logs_admin_access"
    ON public.gmail_account_status_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Trigger Otomatis: Pencatatan Perubahan Status
CREATE OR REPLACE FUNCTION public.trg_log_gmail_account_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.gmail_account_status_logs (
            account_id,
            previous_status,
            new_status,
            changed_by,
            notes,
            created_at
        ) VALUES (
            NEW.id,
            NULL,
            NEW.status,
            NEW.managed_by,
            COALESCE(NEW.notes, 'Akun didaftarkan ke inventori'),
            NOW()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.gmail_account_status_logs (
            account_id,
            previous_status,
            new_status,
            changed_by,
            notes,
            created_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.managed_by,
            NEW.notes,
            NOW()
        );
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gmail_account_status_change ON public.gmail_accounts;
CREATE TRIGGER trg_gmail_account_status_change
    AFTER INSERT OR UPDATE ON public.gmail_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_log_gmail_account_status_change();
