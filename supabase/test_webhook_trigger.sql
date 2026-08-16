-- ==========================================
-- TEST TRIGGER WEBHOOK INVENTORY
-- ==========================================

-- 1. Insert test inventory record
--    Trigger akan fire karena AFTER INSERT OR UPDATE
INSERT INTO public.inventory (
  id,
  game_id,
  added_by,
  title_reference,
  account_specs,
  screenshot_url,
  image_urls,
  capital_price,
  asking_price,
  sold_price,
  status,
  sold_at,
  title_reference_vector,
  public_id
)
VALUES (
  gen_random_uuid(),
  '02a44e53-6f66-4d98-ad08-54baa2d8c7d6',
  null,
  'Test Webhook Trigger - INSERT',
  'Test account specs',
  'https://example.com/screenshot.png',
  '{}',
  100000,
  150000,
  null,
  'AVAILABLE',
  null,
  null,
  'TEST-WEBHOOK-001'
)
RETURNING id, public_id, title_reference;

-- 2. Update test inventory record untuk memicu trigger UPDATE
UPDATE public.inventory
SET
  title_reference = 'Test Webhook Trigger - UPDATE',
  asking_price = 160000,
  updated_at = NOW()
WHERE title_reference = 'Test Webhook Trigger - INSERT'
RETURNING id, public_id, title_reference;

-- 3. Cleanup: hapus test record
--    Catatan: DELETE tidak memicu webhook trigger setelah perubahan terbaru
DELETE FROM public.inventory
WHERE title_reference = 'Test Webhook Trigger - UPDATE'
RETURNING id;
