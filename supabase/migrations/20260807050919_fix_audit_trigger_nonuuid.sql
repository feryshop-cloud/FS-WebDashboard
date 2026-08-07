-- 0045: Patch trigger audit untuk tabel dgn PK teks (mis. products.id = SKU)
-- Masalah: audit_logs.related_id bertipe uuid, tapi products.id teks (buyer_sku_code).
--         trigger trg_audit_products menimbulkan error cast uuid utk id teks.
-- Fix: guard valid uuid -> related_id = id; selain itu NULL (non-blocking).

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_module TEXT;
    v_description TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_related_id UUID := NULL;
BEGIN
    v_user_id := auth.uid();
    v_action := TG_OP;
    v_module := TG_TABLE_NAME;

    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_related_id := public.audit_to_uuid(OLD.id);
        v_description := 'Menghapus data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || OLD.id || ')';
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_related_id := public.audit_to_uuid(NEW.id);
        v_description := 'Mengubah data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_related_id := public.audit_to_uuid(NEW.id);
        v_description := 'Menambahkan data baru pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    END IF;

    INSERT INTO public.audit_logs (
        user_id, action, module, description, old_data, new_data, related_id, created_at
    ) VALUES (
        v_user_id, v_action, v_module, v_description, v_old_data, v_new_data, v_related_id, NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- Helper: kembalikan uuid bila format uuid, else NULL (tahan id teks tak merusak).
CREATE OR REPLACE FUNCTION public.audit_to_uuid(p_id anyelement)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
    IF p_id IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN p_id::text::uuid;
EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$function$;