-- Migration 0023: Fix search_path so the vector type resolves at runtime.
-- inventory_title_vector cast v_vec::vector fails with 'type "vector" does not exist'
-- because the pgvector extension lives in the `extensions` schema, but the function
-- only had `SET search_path = public`.

CREATE OR REPLACE FUNCTION public.inventory_title_vector(
  p_text TEXT,
  p_dim INTEGER DEFAULT 512
)
RETURNS vector
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions
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

GRANT EXECUTE ON FUNCTION public.inventory_title_vector(TEXT, INTEGER) TO anon, authenticated;
