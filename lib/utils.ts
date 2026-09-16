export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string, includeTime: boolean = true): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

export function getBasePath(): string {
  const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  return routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";
}

/**
 * Mem-parsing kode cadangan Google (10 kode × 8 digit).
 * Mendukung format:
 * - 8 digit dengan spasi di tengah: "1234 5678"
 * - 8 digit tanpa spasi: "12345678"
 * - Multiline, spasi, atau dipisahkan koma
 */
export function parseBackupCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const matches = raw.match(/\b\d{4}\s*\d{4}\b|\b\d{8}\b/g);
  if (matches && matches.length > 0) {
    return matches.map((m) => m.replace(/\s+/g, ""));
  }
  return raw
    .split(/[\r\n,]+/)
    .map((s) => s.trim().replace(/\s+/g, ""))
    .filter((s) => s.length > 0);
}
