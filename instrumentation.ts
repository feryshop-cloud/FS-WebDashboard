import { logger } from "@/lib/logger";

export async function register() {}

export function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Headers },
) {
  const headers = request.headers as unknown;
  const requestId =
    headers instanceof Headers
      ? headers.get("x-request-id")
      : (headers as Record<string, string> | undefined)?.["x-request-id"];

  logger.error("request error", {
    err,
    context: `Route: ${request.method} ${request.path}`,
    requestId: requestId ?? undefined,
  });
}
