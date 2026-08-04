-- ============================================================
-- Migration 0032: Add whatsapp and balance columns to public.users
-- Applied: 2026-08-04
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp varchar(50),
  ADD COLUMN IF NOT EXISTS balance numeric(15, 2) DEFAULT 0 NOT NULL;
