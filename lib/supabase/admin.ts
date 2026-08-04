/**
 * DEPRECATED & DISALLOWED:
 * AI_GUARDRAILS.md Chapter 4 strictly prohibits using SUPABASE_SERVICE_ROLE_KEY
 * inside web applications (Next.js client or server actions).
 * Service role operations must only be executed in Supabase Edge Functions or imap-worker.
 */
export function createAdminClient(): never {
  throw new Error(
    "SECURITY VIOLATION: createAdminClient() with SUPABASE_SERVICE_ROLE_KEY is prohibited in Next.js workspace per AI_GUARDRAILS.md Chapter 4. Use RLS + authenticated user client instead.",
  );
}
