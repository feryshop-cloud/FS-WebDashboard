ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read games" ON public.games;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.games;
DROP POLICY IF EXISTS "Allow admin insert" ON public.games;
DROP POLICY IF EXISTS "Allow admin update" ON public.games;
DROP POLICY IF EXISTS "Allow admin delete" ON public.games;

CREATE POLICY "Public can read games"
ON public.games FOR SELECT
TO anon, authenticated
USING (true);


CREATE POLICY "Allow admin insert"
ON public.games FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM roles
      WHERE name IN ('OWNER', 'ADMIN')
    )
  )
);

CREATE POLICY "Allow admin update"
ON public.games FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM roles
      WHERE name IN ('OWNER', 'ADMIN')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM roles
      WHERE name IN ('OWNER', 'ADMIN')
    )
  )
);

CREATE POLICY "Allow admin delete"
ON public.games FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role_id IN (
      SELECT id FROM roles
      WHERE name IN ('OWNER', 'ADMIN')
    )
  )
);
