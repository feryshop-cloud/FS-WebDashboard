-- ============================================
-- Notifications table + RLS + Cleanup
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  target_roles TEXT[] NOT NULL,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_target_roles ON notifications USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User hanya lihat notifikasi untuk role mereka
CREATE POLICY "notifications_role_read" ON notifications FOR SELECT
  USING (
    target_roles && (
      SELECT ARRAY[r.name]
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
    )
  );

-- Service role bisa insert (untuk microservices)
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- User bisa update (untuk mark as read)
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Cleanup function: hapus notifikasi yang sudah dibaca semua target users
CREATE OR REPLACE FUNCTION auto_cleanup_notifications()
RETURNS TRIGGER AS $$
DECLARE
  target_user_count INTEGER;
  read_count INTEGER;
BEGIN
  -- Hitung jumlah user dengan role yang menjadi target
  SELECT COUNT(*) INTO target_user_count
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE r.name = ANY(NEW.target_roles);

  -- Hitung jumlah user yang sudah membaca
  SELECT array_length(NEW.read_by, 1) INTO read_count;

  -- Jika semua user sudah baca, hapus
  IF read_count >= target_user_count THEN
    DELETE FROM notifications WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-cleanup
DROP TRIGGER IF EXISTS trigger_auto_cleanup ON notifications;
CREATE TRIGGER trigger_auto_cleanup
  AFTER UPDATE ON notifications
  FOR EACH ROW
  WHEN (OLD.read_by IS DISTINCT FROM NEW.read_by)
  EXECUTE FUNCTION auto_cleanup_notifications();
