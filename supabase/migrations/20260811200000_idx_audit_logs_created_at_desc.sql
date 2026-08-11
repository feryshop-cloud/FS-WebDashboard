-- Migration: 20260811200000_idx_audit_logs_created_at_desc.sql
-- Description: Tambah indeks B-Tree pada audit_logs(created_at DESC) untuk mempercepat kueri pagination & sorting dashboard audit log.

-- 1. Indeks utama untuk ORDER BY created_at DESC LIMIT X OFFSET Y
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc 
  ON public.audit_logs (created_at DESC);

-- 2. Composite index untuk kueri filter user_id + created_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at 
  ON public.audit_logs (user_id, created_at DESC);
