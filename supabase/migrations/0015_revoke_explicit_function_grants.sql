-- schema_draft/seed granted EXECUTE to anon/authenticated explicitly, and
-- REVOKE ... FROM PUBLIC (done in 0014) does not remove explicit grants.
-- Revoke per-role here so the security advisor stops flagging them.

REVOKE ALL ON FUNCTION public.backfill_inventory_vectors() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_inventory_vectors() TO service_role;

REVOKE ALL ON FUNCTION public.process_payment(uuid, uuid, numeric, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_payment(uuid, uuid, numeric, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.process_stock_purchase(character varying, character varying, text, character varying, character varying, numeric, numeric, numeric, text, text, public.purchase_payment_status, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_stock_purchase(character varying, character varying, text, character varying, character varying, numeric, numeric, numeric, text, text, public.purchase_payment_status, uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.process_account_transfer(uuid, uuid, numeric, numeric, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_account_transfer(uuid, uuid, numeric, numeric, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
