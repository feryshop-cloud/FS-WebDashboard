import { describe, expect, it } from "vitest";
import { ledgerTypeLabel } from "@/lib/ledger";
import { formatRupiah } from "@/lib/export-utils";

describe("ledger", () => {
  it("memetakan tipe yang dikenal ke label Indonesia", () => {
    expect(ledgerTypeLabel("PAYMENT_IN")).toBe("Pembayaran Masuk");
    expect(ledgerTypeLabel("STOCK_PURCHASE")).toBe("Pembelian Stok");
    expect(ledgerTypeLabel("ADJUSTMENT")).toBe("Penyesuaian");
  });

  it("fallback ke tipe asli untuk tipe tak dikenal", () => {
    expect(ledgerTypeLabel("MYSTERY_TYPE")).toBe("MYSTERY_TYPE");
  });
});

describe("formatRupiah", () => {
  it("memformat angka", () => {
    const formatted = formatRupiah(750000);
    expect(formatted).toContain("Rp");
    expect(formatted).toContain("750.000");
  });

  it("handles null/undefined", () => {
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
  });
});
