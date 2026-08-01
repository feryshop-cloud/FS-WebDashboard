-- pgvector-based keyword search for inventory.title_reference.
-- Adds a deterministic, locally-hashed vector column (no external embedding API)
-- plus a SECURITY DEFINER RPC that backfills rows whose vector is NULL.
-- The Railway inventory-vector-worker service calls backfill_inventory_vectors()
-- on an interval so every new row gets its vector populated automatically.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS title_reference_vector vector(512);

-- Deterministic local hashing: tokenize title_reference into words and hash each
-- token into a fixed-dimension bucket to produce a sparse bag-of-words style
-- vector, L2-normalized so cosine similarity reflects keyword overlap.
CREATE OR REPLACE FUNCTION public.inventory_title_vector(
  p_text TEXT,
  p_dim INTEGER DEFAULT 512
)
RETURNS vector
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_vec REAL[];
  v_token TEXT;
  v_idx INTEGER;
  v_norm REAL;
  v_i INTEGER;
  v_hash BIGINT;
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN
    RETURN NULL;
  END IF;

  v_vec := array_fill(0.0::REAL, ARRAY[p_dim]);

  FOR v_token IN
    SELECT word FROM unnest(
      string_to_array(regexp_replace(lower(p_text), '[^a-z0-9]+', ' ', 'g'), ' ')
    ) AS word
    WHERE word <> ''
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

-- Batch backfill: computes the vector for every row where title_reference exists
-- but its vector is still NULL. Returns the number of rows updated so the worker
-- can log progress. SECURITY DEFINER so callers only need the anon key.
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
  SET title_reference_vector = public.inventory_title_vector(title_reference)
  WHERE title_reference_vector IS NULL
    AND title_reference IS NOT NULL
    AND btrim(title_reference) <> '';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_inventory_vectors() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_inventory_vectors() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_title_vector(TEXT, INTEGER) TO anon, authenticated;

-- HNSW index for fast cosine similarity lookups (NULLs are not indexed).
CREATE INDEX IF NOT EXISTS inventory_title_reference_vector_hnsw_idx
ON public.inventory USING hnsw (title_reference_vector vector_cosine_ops);
