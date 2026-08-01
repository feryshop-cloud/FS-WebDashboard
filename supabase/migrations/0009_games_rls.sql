ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access"
ON games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin insert"
ON games FOR INSERT
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
ON games FOR UPDATE
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

CREATE POLICY "Allow admin delete"
ON games FOR DELETE
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