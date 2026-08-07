-- Add a nullable "brand" column to products for the admin top-up catalog.
-- Nullable on purpose: the Digiflazz sync worker (sync_digiflazz_products RPC)
-- inserts/updates products without a brand value, so a NOT NULL column would
-- break sync inserts. Manual brand is set per product from the admin UI.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100);