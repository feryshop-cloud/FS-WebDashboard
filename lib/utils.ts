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

/**
 * Meng-obfuscate string kode cadangan dengan bullet (•),
 * namun tetap mempertahankan tanda koma (,), spasi, titik koma (;), dan baris baru
 * agar pemisah kode tetap terlihat apa adanya oleh pengguna.
 */
export function maskBackupCodes(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/[^,\s\r\n;]/g, "•");
}

/**
 * Menghasilkan rekomendasi kata sandi acak dengan panjang tertentu (default 16 karakter),
 * berformat huruf kapital dan angka (A-Z, 0-9), contoh: "SKDMWKKENC2I3XJ2".
 */
export function generateRandomPassword(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

/**
 * Menghasilkan Nama / Judul Stok secara otomatis berdasarkan Kode Stok
 * dan ekstraksi baris pertama, tengah, dan akhir dari detail akun.
 */
export function generateStockName(kodeStok: string, detailAkun: string): string {
  const cleanKode = (kodeStok || "").trim();

  if (!detailAkun || !detailAkun.trim()) {
    return cleanKode;
  }

  const lines = detailAkun
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return cleanKode;
  }

  let spesifikasi = "";

  if (lines.length === 1) {
    spesifikasi = lines[0];
  } else if (lines.length === 2) {
    spesifikasi = `${lines[0]} ${lines[1]}`;
  } else {
    const firstLine = lines[0];
    const middleIndex = Math.floor(lines.length / 2);
    const middleLine = lines[middleIndex];
    const lastLine = lines[lines.length - 1];
    spesifikasi = [firstLine, middleLine, lastLine].filter(Boolean).join(" ");
  }

  if (!cleanKode) {
    return spesifikasi;
  }

  return spesifikasi ? `${cleanKode} | ${spesifikasi}` : cleanKode;
}

/**
 * Menghasilkan singkatan / kode inisial game berdasarkan namanya.
 * Contoh: "Free Fire" -> "FF", "Mobile Legends" -> "ML", "Roblox" -> "RO"
 */
export function getGameCodeFromName(name: string): string {
  if (!name || !name.trim()) return "GAME";
  const words = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

  let code = "";
  for (const word of words) {
    code += word.charAt(0).toUpperCase();
  }

  if (code.length < 2 && words.length > 0) {
    code = words[0].slice(0, 2).toUpperCase();
  }

  return code.slice(0, 4) || "GAME";
}
