-- Migration: 20260811160000_audit_log_ip_address.sql
-- Description: Tambahkan ip_address ke audit_logs via Postgres session GUC.
--
-- Mekanisme:
--   1. Fungsi set_audit_client_ip(p_ip) dipanggil oleh Next.js createClient()
--      setelah client dibuat (fire-and-forget, non-blocking).
--   2. Fungsi menyimpan IP ke GUC session app.client_ip (is_local=false agar
--      bertahan melewati batas transaksi dalam sesi DB yang sama).
--   3. Trigger process_audit_log() membaca GUC tersebut dan mengisi ip_address.
--
-- Catatan keamanan:
--   - Fungsi ini hanya menerima text dan melakukan set_config — tidak ada DML lain.
--   - Nilai GUC di-truncate ke 45 karakter (IPv6 max = 39 chars + CIDR = 43).
--   - RLS bukan concern di sini: fungsi SECURITY INVOKER, bisa dipanggil
--     oleh role authenticated.

-- =====================================================================
-- 1. Fungsi helper: set GUC app.client_ip untuk sesi ini
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_audit_client_ip(p_ip text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  -- Sanitasi: hanya simpan karakter valid IP/IPv6 (angka, titik, titik dua, slash).
  -- Truncate ke 45 char (batas kolom ip_address).
  PERFORM set_config(
    'app.client_ip',
    left(regexp_replace(p_ip, '[^0-9a-fA-F.:\/]', '', 'g'), 45),
    false  -- false = session-level, bukan transaction-local
  );
END;
$function$;

-- Grant ke authenticated (Next.js Server Actions pakai anon key + session JWT).
REVOKE ALL ON FUNCTION public.set_audit_client_ip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_audit_client_ip(text) TO authenticated, service_role;

-- =====================================================================
-- 2. Update trigger process_audit_log() agar baca GUC dan isi ip_address
-- =====================================================================
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id     UUID;
    v_role_name   TEXT;
    v_ip_address  TEXT;
    v_action      TEXT;
    v_module      TEXT;
    v_description TEXT;
    v_old_data    JSONB := NULL;
    v_new_data    JSONB := NULL;
    v_related_id  UUID  := NULL;

    v_jwt_claims  JSONB;
    v_jwt_sub     TEXT;
BEGIN
    -- ── Resolve user_id dari JWT claims ──────────────────────────────────────
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
        v_jwt_sub    := v_jwt_claims->>'sub';
    EXCEPTION WHEN OTHERS THEN
        v_jwt_sub := NULL;
    END;

    IF v_jwt_sub IS NOT NULL AND v_jwt_sub <> '' THEN
        BEGIN
            v_user_id := v_jwt_sub::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            v_user_id := NULL;
        END;
    ELSE
        v_user_id := auth.uid();
    END IF;

    -- ── Resolve role_name dari public_users → roles ───────────────────────────
    IF v_user_id IS NOT NULL THEN
        SELECT r.name INTO v_role_name
        FROM public.public_users pu
        JOIN public.roles r ON r.id = pu.role_id
        WHERE pu.id = v_user_id
        LIMIT 1;
    END IF;

    -- ── Resolve ip_address dari GUC app.client_ip ─────────────────────────────
    -- Diisi oleh set_audit_client_ip() yang dipanggil Next.js createClient().
    v_ip_address := nullif(current_setting('app.client_ip', true), '');

    -- ── Tentukan action & snapshot data ──────────────────────────────────────
    v_action := TG_OP;
    v_module  := TG_TABLE_NAME;

    IF (TG_OP = 'DELETE') THEN
        v_old_data    := to_jsonb(OLD);
        v_related_id  := public.audit_to_uuid(OLD.id);
        v_description := 'Menghapus data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || OLD.id || ')';
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data    := to_jsonb(OLD);
        v_new_data    := to_jsonb(NEW);
        v_related_id  := public.audit_to_uuid(NEW.id);
        v_description := 'Mengubah data pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data    := to_jsonb(NEW);
        v_related_id  := public.audit_to_uuid(NEW.id);
        v_description := 'Menambahkan data baru pada tabel ' || TG_TABLE_NAME || ' (ID: ' || NEW.id || ')';
    END IF;

    -- ── Insert ke audit_logs ──────────────────────────────────────────────────
    INSERT INTO public.audit_logs (
        user_id, role_name, action, module, description,
        old_data, new_data, related_id, ip_address, created_at
    ) VALUES (
        v_user_id, v_role_name, v_action, v_module, v_description,
        v_old_data, v_new_data, v_related_id, v_ip_address, NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;
