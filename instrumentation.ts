import { logger } from "@/lib/logger";

export async function register() {}

export function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Headers },
) {
  logger.error("request error", {
    error: err,
    path: request.path,
    method: request.method,
    requestId: request.headers.get("x-request-id") ?? undefined,
  });
}
