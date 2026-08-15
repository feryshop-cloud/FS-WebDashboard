/**
 * Derive `{ id }` of the authenticated user from the request headers (Supabase
 * session cookie). The access token is a JWT — its payload is base64url
 * decoded locally (no signature verification, no network call). Returns
 * `undefined` when unauthenticated or the token cannot be decoded — never
 * throws.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const json = Buffer.from(base64 + padding, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function cookieMapFromHeaders(headers: Headers | Record<string, string | string[] | undefined> | unknown): Map<string, string> {
  let cookieHeader: string | null = null;
  if (headers instanceof Headers) {
    cookieHeader = headers.get("cookie");
  } else if (headers && typeof headers === "object") {
    const record = headers as Record<string, string | string[] | undefined>;
    const value = record.cookie ?? record.Cookie;
    if (Array.isArray(value)) cookieHeader = value[0] ?? null;
    else cookieHeader = value ?? null;
  }

  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) map.set(name, value);
  }
  return map;
}

/**
 * Find the first Supabase auth cookie (`sb-<ref>-auth-token`) in the request,
 * decode its access token, and return the user `{ id }`. Mirrors FS-Public's
 * `userFromRequest`, but for Supabase auth instead of next-auth.
 */
export async function userFromRequest(
  headers: Headers | Record<string, string | string[] | undefined> | unknown,
): Promise<{ id: string } | undefined> {
  try {
    const cookieMap = cookieMapFromHeaders(headers);
    for (const [name, value] of cookieMap) {
      if (!/^sb-[^-]+-auth-token$/.test(name)) continue;
      let tokens: unknown;
      try {
        tokens = JSON.parse(value);
      } catch {
        continue;
      }
      const accessToken = Array.isArray(tokens) ? (tokens[0] as string | undefined) : undefined;
      if (!accessToken) continue;
      const payload = decodeJwtPayload(accessToken);
      const id = payload?.sub;
      return id ? { id: String(id) } : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
