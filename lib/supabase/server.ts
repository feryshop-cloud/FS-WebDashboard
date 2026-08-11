import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Sets the client IP as a Postgres session variable (app.client_ip) so the
 * audit log trigger can read it via current_setting('app.client_ip', true).
 *
 * Call this ONCE per Server Action, AFTER confirming the user is authenticated.
 * Do NOT call from createClient() — firing an RPC on every client creation
 * (including unauthenticated requests) causes ERR_TOO_MANY_REDIRECTS loops.
 *
 * Usage in a Server Action:
 *   const supabase = await createClient();
 *   await setAuditClientIp(supabase); // before any DML
 *   await supabase.from("...").insert(...)
 */
export async function setAuditClientIp(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  try {
    const { getClientIp } = await import("@/lib/ip");
    const ip = await getClientIp();
    if (!ip) return;

    const { error } = await supabase.rpc("set_audit_client_ip", { p_ip: ip });
    if (error) {
      console.warn("[audit] set_audit_client_ip failed:", error.message);
    }
  } catch {
    // Non-fatal — audit_logs.ip_address will be NULL for this request.
  }
}
