-- Public-facing inventory ID: game code prefix + per-game sequential number.
-- Examples:
--   "Free Fire"        -> FF-0001, FF-0002, ...
--   "Mobile Legends"   -> ML-0001, ML-0002, ...
-- Numbering is monotonic per game via a counter table (never reused after
-- delete). Existing rows are backfilled.

CREATE TABLE IF NOT EXISTS public.game_public_seq (
  game_id UUID PRIMARY KEY REFERENCES public.games(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL
);

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS public_id VARCHAR(20);

CREATE OR REPLACE FUNCTION public.generate_inventory_public_id()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_num  INTEGER;
BEGIN
  IF NEW.public_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_auto_public_id ON public.inventory;

CREATE TRIGGER trg_inventory_auto_public_id
BEFORE INSERT ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.generate_inventory_public_id();

-- Backfill existing rows.
DO $$
DECLARE
  r      RECORD;
  v_code TEXT;
  v_num  INTEGER;
BEGIN
  FOR r IN
    SELECT id, game_id FROM public.inventory ORDER BY created_at, id
  LOOP
    SELECT g.code INTO v_code FROM public.games g WHERE g.id = r.game_id;
    IF v_code IS NULL OR v_code = '' THEN
      v_code := 'GAME';
    END IF;

    INSERT INTO public.game_public_seq AS s (game_id, last_number)
    VALUES (r.game_id, 1)
    ON CONFLICT (game_id)
    DO UPDATE SET last_number = s.last_number + 1
    RETURNING last_number INTO v_num;

    UPDATE public.inventory
    SET public_id = v_code || '-' || lpad(v_num::TEXT, 4, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_public_id_unique
ON public.inventory (public_id);

ALTER TABLE public.inventory
  ALTER COLUMN public_id SET NOT NULL;
