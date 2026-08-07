-- Migration: 0040_tighten_write_policies.sql
-- Description: Close always-true write policies flagged by the advisor.
--   - categories: writes now require is_admin() (server action only checks
--     "user exists", not role -> policy is the authorization boundary).
--   - promotional_templates: same, writes require is_admin().
--   - worker_heartbeat: drop PUBLIC ALL (service_role writes via RLS bypass).
--   - game_public_seq: make the generator SECURITY DEFINER so it bypasses RLS
--     for the invoker, then drop the authenticated ALL policy (internal counter).

-- 1. categories -- admin writes, public reads unchanged
DROP POLICY IF EXISTS "categories_authenticated_all" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- 2. promotional_templates -- every statement requires admin
DROP POLICY IF EXISTS "Admins can insert promotional templates" ON public.promotional_templates;
DROP POLICY IF EXISTS "Admins can update promotional templates" ON public.promotional_templates;
DROP POLICY IF EXISTS "Admins can delete promotional templates" ON public.promotional_templates;
CREATE POLICY "Admins can insert promotional templates" ON public.promotional_templates
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update promotional templates" ON public.promotional_templates
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete promotional templates" ON public.promotional_templates
  FOR DELETE TO authenticated USING (public.is_admin());

-- 3. worker_heartbeat -- no PUBLIC access; workers use service_role (bypasses RLS)
DROP POLICY IF EXISTS "Allow public access to worker_heartbeat" ON public.worker_heartbeat;

-- 4. game_public_seq -- generator runs as definer, internal-only
CREATE OR REPLACE FUNCTION public.generate_inventory_public_id()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_num  INTEGER;
BEGIN
  IF NEW.public_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT g.code INTO v_code FROM public.games g WHERE g.id = NEW.game_id;
  IF v_code IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'Cannot generate public_id: game code missing for game_id %', NEW.game_id;
  END IF;

  INSERT INTO public.game_public_seq AS s (game_id, last_number)
  VALUES (NEW.game_id, 1)
  ON CONFLICT (game_id)
  DO UPDATE SET last_number = s.last_number + 1
  RETURNING last_number INTO v_num;

  NEW.public_id := v_code || '-' || lpad(v_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "game_public_seq_authenticated_all" ON public.game_public_seq;
