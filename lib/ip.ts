/**
 * Extracts the real client IP address from Next.js request headers.
 *
 * Priority order:
 *   1. x-real-ip       — set by Nginx gateway (most trustworthy in our stack)
 *   2. x-forwarded-for — standard proxy header; take the first (leftmost) IP
 *
 * Returns null when headers are unavailable (e.g. during static rendering).
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();

    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();

    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0];
      return first.trim();
    }

    return null;
  } catch {
    // headers() throws outside of a request context (e.g. static build).
    return null;
  }
}
