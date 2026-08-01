-- `image_url` is the single database source of truth for game images.
-- Storefront responses may still expose an `image` field for UI compatibility,
-- but it must be derived from `image_url` in application code.

ALTER TABLE public.games
  DROP COLUMN IF EXISTS image;
