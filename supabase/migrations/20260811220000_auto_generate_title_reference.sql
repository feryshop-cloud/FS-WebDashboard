-- Auto-generate title_reference if null or empty string

CREATE OR REPLACE FUNCTION public.generate_inventory_public_id()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_num  INTEGER;
  v_spec TEXT;
BEGIN
  -- 1. Generate public_id (e.g. ML-0001) if not provided
  IF NEW.public_id IS NULL THEN
    SELECT g.code INTO v_code FROM public.games g WHERE g.id = NEW.game_id;
    IF v_code IS NULL OR v_code = '' THEN
      RAISE EXCEPTION 'Cannot generate public_id: game code missing for game_id %', NEW.game_id;
    END IF;

    INSERT INTO public.game_public_seq AS s (game_id, last_number)
    VALUES (NEW.game_id, 1)
    ON CONFLICT (game_id)
    DO UPDATE SET last_number = s.last_number + 1
    RETURNING last_number INTO v_num;

    NEW.public_id := v_code || '-' || lpad(v_num::TEXT, 4, '0');
  END IF;

  -- 2. Auto-generate title_reference (Kode Referensi) if not provided
  IF NEW.title_reference IS NULL OR NEW.title_reference = '' THEN
    -- Extract first part of account_specs (before first comma)
    v_spec := btrim(split_part(NEW.account_specs, ',', 1));
    -- Clean spaces to hyphens and format alphanumeric only
    v_spec := regexp_replace(v_spec, '\s+', '-', 'g'); 
    v_spec := upper(regexp_replace(v_spec, '[^a-zA-Z0-9\-]', '', 'g')); 
    IF v_spec = '' THEN
      v_spec := 'SPEC';
    END IF;
    -- Set reference as public_id + spec (e.g., ML-0001-MYTHIC)
    NEW.title_reference := NEW.public_id || '-' || substring(v_spec from 1 for 20);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
