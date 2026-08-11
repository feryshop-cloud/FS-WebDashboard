import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getClientIp } from "@/lib/ip";

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
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

  // Set the client IP as a Postgres session variable so the audit log
  // trigger (process_audit_log) can read it via current_setting().
  // This must be set on every createClient() call because each Server Action
  // request may land on a different (or recycled) DB connection.
  const ip = await getClientIp();
  if (ip) {
    // Fire-and-forget — do not await so we don't block the caller.
    // Errors are silently swallowed to ensure audit IP never breaks business logic.
    client.rpc("set_audit_client_ip", { p_ip: ip }).then(({ error }) => {
      if (error) {
        // Non-fatal: audit_logs.ip_address will be NULL for this request.
        console.warn("[audit] set_audit_client_ip failed:", error.message);
      }
    });
  }

  return client;
}
