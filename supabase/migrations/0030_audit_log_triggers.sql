-- Migration: Automatic Audit Log Triggers for Key Tables

-- 1. Generic audit log trigger function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_module TEXT;
    v_description TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_related_id UUID := NULL;
BEGIN
    -- Determine current user ID from Supabase auth context
    v_user_id := auth.uid();
    v_action := TG_OP; -- 'INSERT', 'UPDATE', or 'DELETE'
    v_module := TG_TABLE_NAME;

    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_related_id := OLD.id;
        v_description := 'Menghapus data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || OLD.id || ')';
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_related_id := NEW.id;
        v_description := 'Mengubah data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_related_id := NEW.id;
        v_description := 'Menambahkan data baru pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    END IF;

    INSERT INTO public.audit_logs (
        user_id,
        action,
        module,
        description,
        old_data,
        new_data,
        related_id,
        created_at
    ) VALUES (
        v_user_id,
        v_action,
        v_module,
        v_description,
        v_old_data,
        v_new_data,
        v_related_id,
        NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to finance_ledger
DROP TRIGGER IF EXISTS trg_audit_finance_ledger ON public.finance_ledger;
CREATE TRIGGER trg_audit_finance_ledger
AFTER INSERT OR UPDATE OR DELETE ON public.finance_ledger
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 3. Attach trigger to deals
DROP TRIGGER IF EXISTS trg_audit_deals ON public.deals;
CREATE TRIGGER trg_audit_deals
AFTER INSERT OR UPDATE OR DELETE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 4. Attach trigger to stocks
DROP TRIGGER IF EXISTS trg_audit_stocks ON public.stocks;
CREATE TRIGGER trg_audit_stocks
AFTER INSERT OR UPDATE OR DELETE ON public.stocks
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5. Attach trigger to accounts
DROP TRIGGER IF EXISTS trg_audit_accounts ON public.accounts;
CREATE TRIGGER trg_audit_accounts
AFTER INSERT OR UPDATE OR DELETE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 6. Attach trigger to problem_cases
DROP TRIGGER IF EXISTS trg_audit_problem_cases ON public.problem_cases;
CREATE TRIGGER trg_audit_problem_cases
AFTER INSERT OR UPDATE OR DELETE ON public.problem_cases
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
