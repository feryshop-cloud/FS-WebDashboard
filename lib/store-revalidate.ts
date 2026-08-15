import { logger } from "@/lib/logger";

/**
 * Tags storefront data-cache (FS-Public, sistem 'use cache' + revalidateTag).
 * Dikirim ke /api/revalidate storefront setiap ada mutasi data yang tampil di sana.
 */
export const STOREFRONT_TAGS = {
  games: ["catalog-games"] as const,
  products: ["catalog-products"] as const,
  categories: ["catalog-categories"] as const,
  payment: ["catalog-payment"] as const,
  settings: ["settings"] as const,
  marketplace: ["marketplace"] as const,
} as const;

const STORE_REVALIDATE_URL = process.env.STORE_REVALIDATE_URL?.replace(/\/+$/, "");
const STORE_REVALIDATE_SECRET = process.env.STORE_REVALIDATE_SECRET;

/**
 * Purge cache storefront (FS-Public) secara best-effort (fire-and-forget).
 * Tidak memblokir respons admin; jika storefront down, data tetap sinkron via cacheLife.
 */
export function purgeStorefront(tags: readonly string[]): void {
  const url = STORE_REVALIDATE_URL;
  const secret = STORE_REVALIDATE_SECRET;
  if (!url || !secret || tags.length === 0) return;

  void (async () => {
    try {
      const res = await fetch(`${url}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        logger.warn("storefront revalidate non-ok", {
          status: res.status,
          tags,
          body: (await res.text().catch(() => "")).slice(0, 200),
        });
      }
    } catch (error) {
      logger.warn("storefront revalidate failed", { tags, error });
    }
  })();
}
