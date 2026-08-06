-- Auto-generate a short game code from the game name's initials.
-- Examples:
--   "Mobile Legends"  -> ML
--   "Free Fire"       -> FF
--   "Genshin Impact"  -> GI
--   "Roblox"          -> RO  (single word: first 2 letters)
-- Collisions get a numeric suffix (ML-2). Existing rows are backfilled.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Pure generator: initials of each word, uppercase, min 2 chars, max 4.
CREATE OR REPLACE FUNCTION public.game_code_from_name(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_word  TEXT;
  v_clean TEXT;
  v_code  TEXT := '';
BEGIN
  v_clean := lower(regexp_replace(COALESCE(p_name, ''), '[^a-zA-Z0-9]+', ' ', 'g'));

  FOREACH v_word IN ARRAY string_to_array(btrim(v_clean), ' ')
  LOOP
    IF v_word <> '' THEN
      v_code := v_code || upper(left(v_word, 1));
    END IF;
  END LOOP;

  IF length(v_code) < 2 THEN
    v_code := upper(left(v_clean, 2));
  END IF;

  v_code := left(v_code, 4);

  RETURN NULLIF(v_code, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: fills code on insert (when omitted) and re-derives it whenever the
-- name changes. Dedupes collisions against other rows.
CREATE OR REPLACE FUNCTION public.generate_game_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code    TEXT;
  v_base    TEXT;
  v_n       INTEGER := 2;
  v_found   BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_code := public.game_code_from_name(NEW.name);
  IF v_code IS NULL THEN
    v_code := 'GAME';
  END IF;

  v_base := v_code;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.games
      WHERE code = v_code
        AND (TG_OP = 'INSERT' OR id <> NEW.id)
    ) INTO v_found;
    EXIT WHEN NOT v_found;

    v_code := v_base || '-' || v_n::TEXT;
    v_n := v_n + 1;
  END LOOP;

  NEW.code := v_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_games_auto_code ON public.games;

CREATE TRIGGER trg_games_auto_code
BEFORE INSERT OR UPDATE OF name ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.generate_game_code();

-- Backfill existing rows with dedupe.
DO $$
DECLARE
  r       RECORD;
  v_code  TEXT;
  v_base  TEXT;
  v_n     INTEGER;
BEGIN
  FOR r IN
    SELECT id, name FROM public.games ORDER BY created_at, id
  LOOP
    v_code := public.game_code_from_name(r.name);
    IF v_code IS NULL THEN
      v_code := 'GAME';
    END IF;
    v_base := v_code;
    v_n := 2;
    WHILE EXISTS (
      SELECT 1 FROM public.games
      WHERE code = v_code AND id <> r.id
    ) LOOP
      v_code := v_base || '-' || v_n::TEXT;
      v_n := v_n + 1;
    END LOOP;
    UPDATE public.games SET code = v_code WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS games_code_unique
ON public.games (code);

ALTER TABLE public.games
  ALTER COLUMN code SET NOT NULL;
