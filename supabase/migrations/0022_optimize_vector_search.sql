-- Migration 0022: Optimize vector search with hybrid full-text + vector ranking

-- 1. Add tsvector column for fast keyword search
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Improve vector embedding: include both title_reference and account_specs
CREATE OR REPLACE FUNCTION public.inventory_title_vector(
  p_text TEXT,
  p_dim INTEGER DEFAULT 512
)
RETURNS vector
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_vec REAL[];
  v_token TEXT;
  v_idx INTEGER;
  v_norm REAL;
  v_i INTEGER;
  v_hash BIGINT;
  v_processed TEXT;
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN
    RETURN NULL;
  END IF;

  v_vec := array_fill(0.0::REAL, ARRAY[p_dim]);

  v_processed := lower(p_text);
  v_processed := regexp_replace(v_processed, '[^a-z0-9\s]+', ' ', 'g');
  v_processed := regexp_replace(v_processed, '\s+', ' ', 'g');
  v_processed := btrim(v_processed);

  FOR v_token IN
    SELECT word FROM unnest(
      string_to_array(v_processed, ' ')
    ) AS word
    WHERE word <> '' AND length(word) > 1
  LOOP
    v_hash := abs(hashtextextended(v_token, 0));
    v_idx := (v_hash % p_dim)::INTEGER;
    v_vec[v_idx + 1] := v_vec[v_idx + 1] + 1.0;
  END LOOP;

  v_norm := 0.0;
  FOR v_i IN 1..p_dim LOOP
    v_norm := v_norm + v_vec[v_i] * v_vec[v_i];
  END LOOP;

  IF v_norm = 0 THEN
    RETURN NULL;
  END IF;

  FOR v_i IN 1..p_dim LOOP
    v_vec[v_i] := v_vec[v_i] / sqrt(v_norm);
  END LOOP;

  RETURN v_vec::vector;
END;
$$;

-- 3. Update backfill to use combined title + specs text
CREATE OR REPLACE FUNCTION public.backfill_inventory_vectors()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.inventory
  SET title_reference_vector = public.inventory_title_vector(
    COALESCE(title_reference, '') || ' ' || COALESCE(account_specs, '')
  )
  WHERE title_reference_vector IS NULL
    AND (title_reference IS NOT NULL AND btrim(title_reference) <> ''
         OR account_specs IS NOT NULL AND btrim(account_specs) <> '');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- 4. Trigger function to keep search_vector in sync
CREATE OR REPLACE FUNCTION public.inventory_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title_reference, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.account_specs, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_search_vector_trigger ON public.inventory;
CREATE TRIGGER inventory_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title_reference, account_specs
  ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.inventory_search_vector_update();

-- 5. Backfill search_vector for existing rows
UPDATE public.inventory
SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(title_reference, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(account_specs, '')), 'B')
WHERE search_vector IS NULL;

-- 6. GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS inventory_search_vector_gin_idx
  ON public.inventory USING GIN (search_vector);

-- 7. Hybrid search RPC: combines vector similarity with full-text rank
CREATE OR REPLACE FUNCTION public.search_inventory(
  query_text TEXT,
  game_slug_filter TEXT DEFAULT NULL,
  match_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  query_vector extensions.vector(512);
  query_tsquery tsquery;
BEGIN
  query_vector := public.inventory_title_vector(query_text);
  query_tsquery := plainto_tsquery('simple', query_text);

  RETURN QUERY
  SELECT i.*
  FROM public.inventory i
  LEFT JOIN public.games g ON i.game_id = g.id
  WHERE i.status = 'AVAILABLE'::public.inventory_status
    AND (game_slug_filter IS NULL OR g.slug = game_slug_filter)
    AND (
      query_tsquery IS NULL 
      OR i.search_vector @@ query_tsquery 
      OR query_vector IS NULL
    )
  ORDER BY 
    CASE 
      WHEN query_vector IS NOT NULL AND i.title_reference_vector IS NOT NULL 
      THEN (1 - (i.title_reference_vector <=> query_vector))
      ELSE 0
    END * 0.4
    + CASE 
      WHEN query_tsquery IS NOT NULL AND i.search_vector IS NOT NULL 
      THEN ts_rank_cd(i.search_vector, query_tsquery, 1)
      ELSE 0
    END * 0.6 DESC,
    i.created_at DESC
  LIMIT match_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_inventory_vectors() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_title_vector(TEXT, INTEGER) TO anon, authenticated;
