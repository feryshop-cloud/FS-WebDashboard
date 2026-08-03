DROP FUNCTION IF EXISTS public.search_inventory(TEXT, TEXT, INTEGER);

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
BEGIN
  query_vector := public.inventory_title_vector(query_text);

  IF query_vector IS NULL THEN
    RETURN QUERY
    SELECT i.*
    FROM public.inventory i
    LEFT JOIN public.games g ON i.game_id = g.id
    WHERE i.status = 'AVAILABLE'::public.inventory_status
      AND (game_slug_filter IS NULL OR g.slug = game_slug_filter)
    ORDER BY i.created_at DESC
    LIMIT match_limit;
  ELSE
    RETURN QUERY
    SELECT i.*
    FROM public.inventory i
    LEFT JOIN public.games g ON i.game_id = g.id
    WHERE i.status = 'AVAILABLE'::public.inventory_status
      AND (game_slug_filter IS NULL OR g.slug = game_slug_filter)
    ORDER BY i.title_reference_vector <=> query_vector
    LIMIT match_limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_inventory(TEXT, TEXT, INTEGER) TO anon, authenticated;
