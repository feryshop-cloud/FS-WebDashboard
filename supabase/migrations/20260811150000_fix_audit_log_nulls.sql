-- Migration: 20260811150000_fix_audit_log_nulls.sql
-- Description: Fix audit_logs.user_id dan role_name yang selalu NULL.
--
-- Root causes:
--   1. process_audit_log() SECURITY DEFINER membuat auth.uid() tidak bisa
--      membaca JWT claim dari session user (berjalan sebagai owner fungsi).
--      Fix: baca sub dari request.jwt.claims via current_setting(), fallback
--      ke auth.uid() bila claim tersedia.
--   2. role_name tidak pernah diisi — lookup dari public_users.role_id →
--      roles.name setelah user_id ditemukan.
--   3. ip_address tidak bisa diisi dari trigger DB — field dibiarkan NULL
--      (pengisian harus dari layer aplikasi bila diperlukan).
--   4. old_data NULL pada INSERT: by design (tidak ada data lama).
--
-- Catatan keamanan:
--   Fungsi tetap SECURITY DEFINER (diperlukan agar trigger bisa INSERT ke
--   audit_logs walau tabel menggunakan RLS admin-only). search_path di-pin
--   ke 'public' agar tidak ada path injection.

CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id    UUID;
    v_role_name  TEXT;
    v_action     TEXT;
    v_module     TEXT;
    v_description TEXT;
    v_old_data   JSONB := NULL;
    v_new_data   JSONB := NULL;
    v_related_id UUID  := NULL;

    -- Baca user_id dari JWT claims (cara yang benar untuk SECURITY DEFINER).
    -- current_setting tidak throw bila key tidak ada jika pakai (true) = missing_ok.
    v_jwt_claims JSONB;
    v_jwt_sub    TEXT;
BEGIN
    -- ── Resolve user_id ──────────────────────────────────────────────────────
    -- Supabase menyimpan JWT claims di GUC request.jwt.claims saat request
    -- datang via PostgREST / Supabase JS client.
    -- SECURITY DEFINER tidak menghapus GUC ini, jadi ini aman dibaca.
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
        -- Fallback ke auth.uid() untuk path non-PostgREST (mis. direct psql).
        v_user_id := auth.uid();
    END IF;

    -- ── Resolve role_name ─────────────────────────────────────────────────────
    IF v_user_id IS NOT NULL THEN
        SELECT r.name INTO v_role_name
        FROM public.public_users pu
        JOIN public.roles r ON r.id = pu.role_id
        WHERE pu.id = v_user_id
        LIMIT 1;
        -- Jika user tidak punya role atau join gagal, v_role_name tetap NULL.
    END IF;

    -- ── Tentukan action & data ────────────────────────────────────────────────
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
        old_data, new_data, related_id, created_at
    ) VALUES (
        v_user_id, v_role_name, v_action, v_module, v_description,
        v_old_data, v_new_data, v_related_id, NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;
