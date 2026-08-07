-- Migration: 0038_game_public_seq_rls.sql
-- Description: Enable RLS on the internal game_public_seq counter table and
-- grant DML to authenticated + service_role (the roles that drive inventory
-- inserts via generate_inventory_public_id). Excludes `anon`, closing the
-- exposure flagged by Supabase advisor.

ALTER TABLE public.game_public_seq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_public_seq_authenticated_all" ON public.game_public_seq;
CREATE POLICY "game_public_seq_authenticated_all"
  ON public.game_public_seq
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "game_public_seq_service_all" ON public.game_public_seq;
CREATE POLICY "game_public_seq_service_all"
  ON public.game_public_seq
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);