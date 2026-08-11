-- Backfill existing inventory rows to use auto-generated title_reference format: [public_id]-[clean_spec]

DO $$
DECLARE
  r RECORD;
  v_spec TEXT;
  v_new_ref TEXT;
BEGIN
  FOR r IN
    SELECT id, public_id, account_specs FROM public.inventory WHERE public_id IS NOT NULL
  LOOP
    IF r.account_specs IS NOT NULL AND r.account_specs <> '' THEN
      v_spec := btrim(split_part(regexp_replace(r.account_specs, '[\.,]', ','), ',', 1));
      v_spec := regexp_replace(v_spec, '\s+', '-', 'g');
      v_spec := upper(regexp_replace(v_spec, '[^a-zA-Z0-9\-]', '', 'g'));
      IF v_spec = '' THEN
        v_spec := 'SPEC';
      END IF;
      v_new_ref := r.public_id || '-' || substring(v_spec from 1 for 20);
    ELSE
      v_new_ref := r.public_id;
    END IF;

    UPDATE public.inventory
    SET title_reference = v_new_ref
    WHERE id = r.id;
  END LOOP;
END $$;
