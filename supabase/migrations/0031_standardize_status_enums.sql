-- ============================================================
-- Migration 0031: Standardize status columns to PostgreSQL ENUM
-- Applied: 2026-08-04
-- Tables: users, problem_cases, payment_methods, stock_histories
-- ============================================================

-- STEP 1: DROP CHECK constraints lama
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.problem_cases DROP CONSTRAINT IF EXISTS problem_cases_status_check;

-- STEP 2: DROP DEFAULT lama (wajib sebelum ALTER TYPE)
ALTER TABLE public.users ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.problem_cases ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.payment_methods ALTER COLUMN status DROP DEFAULT;

-- STEP 3: UPDATE data ke nilai ENUM baru
-- users
UPDATE public.users SET status = 'ACTIVE'   WHERE status = 'Aktif';
UPDATE public.users SET status = 'INACTIVE' WHERE status = 'Nonaktif';

-- problem_cases (9 nilai Bahasa Indonesia → uppercase Inggris)
UPDATE public.problem_cases SET status = 'OPEN'               WHERE status = 'Open';
UPDATE public.problem_cases SET status = 'IN_PROGRESS'        WHERE status = 'Ditindaklanjuti';
UPDATE public.problem_cases SET status = 'WAITING_CUSTOMER'   WHERE status = 'Menunggu Customer';
UPDATE public.problem_cases SET status = 'WAITING_THIRD_PARTY' WHERE status = 'Menunggu Pihak Ketiga';
UPDATE public.problem_cases SET status = 'RESOLVED'           WHERE status = 'Selesai';
UPDATE public.problem_cases SET status = 'CANNOT_RESOLVE'     WHERE status = 'Tidak bisa diselesaikan';
UPDATE public.problem_cases SET status = 'PERMANENT'          WHERE status = 'Permanen';
UPDATE public.problem_cases SET status = 'REFUND'             WHERE status = 'Refund';
UPDATE public.problem_cases SET status = 'CANCEL'             WHERE status = 'Cancel';

-- payment_methods (lowercase → uppercase)
UPDATE public.payment_methods SET status = 'ACTIVE'   WHERE status = 'active';
UPDATE public.payment_methods SET status = 'INACTIVE' WHERE status = 'inactive';

-- STEP 4: CREATE ENUM types baru
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE public.problem_case_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_THIRD_PARTY',
  'RESOLVED',
  'CANNOT_RESOLVE',
  'PERMANENT',
  'REFUND',
  'CANCEL'
);

-- STEP 5: ALTER COLUMN ke ENUM baru
ALTER TABLE public.users
  ALTER COLUMN status TYPE public.user_status
  USING status::public.user_status;

ALTER TABLE public.problem_cases
  ALTER COLUMN status TYPE public.problem_case_status
  USING status::public.problem_case_status;

ALTER TABLE public.payment_methods
  ALTER COLUMN status TYPE public.user_status
  USING status::public.user_status;

ALTER TABLE public.stock_histories
  ALTER COLUMN status TYPE public.user_status
  USING COALESCE(NULLIF(status, '')::public.user_status, 'ACTIVE');

-- STEP 6: Set DEFAULT baru sesuai ENUM
ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'ACTIVE';
ALTER TABLE public.problem_cases ALTER COLUMN status SET DEFAULT 'OPEN';
ALTER TABLE public.payment_methods ALTER COLUMN status SET DEFAULT 'ACTIVE';
