import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { runWithRequestId } from "@/lib/logging/request-context";

/**
 * Wraps a server action body with structured logging:
 * - reads `x-request-id` from the action's request headers and binds it into the
 *   async-local request context, so every logger call inside carries the same
 *   correlation id (same id also echoed by proxy.ts as response header),
 * - logs completion (duration) and any thrown error (with stack) via the logger.
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

  const start = performance.now();

  return runWithRequestId(requestId, async () => {
    try {
      const result = await fn();
      logger.debug("action completed", {
        context: `ServerAction: ${name}`,
        durationMs: Math.round(performance.now() - start),
      });
      return result;
    } catch (err) {
      logger.error("action failed", {
        context: `ServerAction: ${name}`,
        err,
        durationMs: Math.round(performance.now() - start),
      });
      throw err;
    }
  });
}
