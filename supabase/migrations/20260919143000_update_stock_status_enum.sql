-- Migration: Update stock_status enum to support standardized statuses
-- Statuses: 'DRAFT', 'WAITING_PAYMENT', 'AVAILABLE', 'BOOKED', 'LIMITED_ACCESS', 'ON_HOLD', 'PROBLEM', 'ARCHIVED', 'SOLD'

ALTER TYPE public.stock_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE public.stock_status ADD VALUE IF NOT EXISTS 'WAITING_PAYMENT';
ALTER TYPE public.stock_status ADD VALUE IF NOT EXISTS 'PROBLEM';
ALTER TYPE public.stock_status ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE public.stock_status ADD VALUE IF NOT EXISTS 'UNPOSTED';
