-- Migration: 20260811170000_grant_schema_private_usage.sql
-- Description: Grant USAGE on schema `private` to authenticated & anon roles.
--
-- Problem:
--   Migration 20260811120000 moved SECURITY DEFINER logic into a `private` schema
--   and granted EXECUTE on `private.user_is_admin()` to `authenticated`.
--   However, without `GRANT USAGE ON SCHEMA private TO authenticated, anon`,
--   PostgreSQL rejects calling functions in schema `private` with:
--   "permission denied for schema private" (Error code 42501).
--   This broke all public wrapper functions like public.is_admin() and RLS policies!
--
-- Fix:
--   Grant USAGE on schema `private` so authenticated/anon can resolve function names
--   in `private`. Function-level EXECUTE permissions still strictly control which
--   functions can be executed.

GRANT USAGE ON SCHEMA private TO authenticated, anon;
