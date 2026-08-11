import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { runWithRequestId } from "@/lib/logging/request-context";
import { createClient, setAuditClientIp } from "@/lib/supabase/server";

/**
 * Wraps a server action body with structured logging:
 * - reads `x-request-id` from the action's request headers and binds it into the
 *   async-local request context, so every logger call inside carries the same
 *   correlation id (same id also echoed by proxy.ts as response header),
 * - logs completion (duration) and any thrown error (with stack) via the logger.
 * - sets the client IP as a Postgres session GUC (app.client_ip) so every DML
 *   inside fn() that fires the audit trigger will have ip_address populated.
 *
 * Usage:
 *   export async function getDeals() {
 *     return runAction("getDeals", async () => { ... });
 *   }
 */
export async function runAction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  let requestId: string | undefined;
  try {
    const requestHeaders = await headers();
    requestId = requestHeaders.get("x-request-id") ?? undefined;
  } catch {
    requestId = undefined;
  }

  // Set client IP as Postgres session variable before running the action.
  // The GUC is session-level (is_local=false in set_audit_client_ip), so it
  // persists on the PostgREST connection and is visible to the audit trigger
  // when DML fires inside fn(). Non-blocking and non-fatal.
  try {
    const supabase = await createClient();
    await setAuditClientIp(supabase);
  } catch {
    // Never let IP resolution break a Server Action.
  }

  const start = performance.now();

  return runWithRequestId(requestId, async () => {
    try {
      const result = await fn();
      logger.debug("action completed", {
        action: name,
        durationMs: Math.round(performance.now() - start),
      });
      return result;
    } catch (err) {
      logger.error("action failed", {
        action: name,
        error: err,
        durationMs: Math.round(performance.now() - start),
      });
      throw err;
    }
  });
}
