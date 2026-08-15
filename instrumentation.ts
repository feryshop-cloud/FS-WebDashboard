import { logger } from "@/lib/logger";
import { userFromRequest } from "@/lib/logging/user-context";

export async function register() {}

function headerValue(headers: unknown, name: string): string | null {
  if (headers instanceof Headers) return headers.get(name);
  if (headers && typeof headers === "object") {
    const record = headers as Record<string, string | string[] | undefined>;
    const value = record[name] ?? record[name.toLowerCase()];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }
  return null;
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: unknown },
) {
  const actionId = headerValue(request.headers, "next-action");
  const isServerAction = actionId !== null;
  const context = isServerAction
    ? `ServerAction: ${request.path}`
    : `Route: ${request.method} ${request.path}`;

  logger.error("request error", {
    err,
    context,
    requestId: headerValue(request.headers, "x-request-id") ?? undefined,
    ...(isServerAction ? { actionId: actionId ?? undefined } : {}),
    user: await userFromRequest(request.headers),
  });
}
