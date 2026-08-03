-- RPC for vector search over inventory
CREATE OR REPLACE FUNCTION public.search_inventory(
  query_text TEXT,
  game_slug_filter TEXT DEFAULT NULL,
  match_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  added_by UUID,
  title_reference TEXT,
  account_specs TEXT,
  screenshot_url TEXT,
  image_urls TEXT[],
  capital_price INTEGER,
  asking_price INTEGER,
  sold_price INTEGER,
  status public.inventory_status,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  query_vector extensions.vector(512);
BEGIN
  -- Convert query text to vector representation
  query_vector := public.inventory_title_vector(query_text);

  IF query_vector IS NULL THEN
    -- Fallback to standard text search or return available if query is empty
    RETURN QUERY
    SELECT 
      i.id, i.game_id, i.added_by, i.title_reference, i.account_specs, 
      i.screenshot_url, i.image_urls, i.capital_price, i.asking_price, 
      i.sold_price, i.status, i.sold_at, i.created_at, i.updated_at
    FROM public.inventory i
    LEFT JOIN public.games g ON i.game_id = g.id
    WHERE i.status = 'AVAILABLE'::public.inventory_status
      AND (game_slug_filter IS NULL OR g.slug = game_slug_filter)
    ORDER BY i.created_at DESC
    LIMIT match_limit;
  ELSE
    RETURN QUERY
    SELECT 
      i.id, i.game_id, i.added_by, i.title_reference, i.account_specs, 
      i.screenshot_url, i.image_urls, i.capital_price, i.asking_price, 
      i.sold_price, i.status, i.sold_at, i.created_at, i.updated_at
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
