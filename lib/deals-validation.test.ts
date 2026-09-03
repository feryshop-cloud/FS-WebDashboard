import { describe, expect, it, vi } from "vitest";
import { formatDate } from "./utils";
import { createPenjualan } from "@/app/actions/deals";
import { createTukarTambah } from "@/app/actions/trade-in";

// Mock dependencies that require Supabase or Next.js server runtime
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-admin-id" } },
      }),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/store-revalidate", () => ({
  purgeStorefront: vi.fn(),
  STOREFRONT_TAGS: { marketplace: "marketplace" },
}));

describe("Format Date Utility Hardening", () => {
  it("mengembalikan tanggal terformat untuk input valid ISO string", () => {
    const result = formatDate("2026-09-03T10:30:00.000Z", false);
    expect(result).not.toBe("-");
    expect(result).toContain("2026");
  });

  it("mengembalikan '-' untuk string kosong atau falsy", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate(null as unknown as string)).toBe("-");
    expect(formatDate(undefined as unknown as string)).toBe("-");
  });

  it("mengembalikan '-' tanpa throw exception untuk invalid date string", () => {
    expect(() => formatDate("invalid-date-string")).not.toThrow();
    expect(formatDate("invalid-date-string")).toBe("-");
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("Transaksi Penjualan Validation & Error Protection", () => {
  it("mengembalikan structured error jika customer_name kosong tanpa throw", async () => {
    const fd = new FormData();
    fd.append("customer_name", "");
    fd.append("stock_id", "stock-123");
    fd.append("price", "500000");

    const result = await createPenjualan(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Nama customer wajib diisi");
  });

  it("mengembalikan structured error jika stok tidak dipilih tanpa throw", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Budi Santoso");
    fd.append("stock_id", "");
    fd.append("price", "500000");

    const result = await createPenjualan(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pilih stok yang akan dijual");
  });

  it("mengembalikan structured error jika harga tidak valid atau <= 0", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Budi Santoso");
    fd.append("stock_id", "stock-123");
    fd.append("price", "0");

    const result = await createPenjualan(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Harga deal harus berupa angka lebih besar dari 0");
  });

  it("mengembalikan structured error jika payment_amount > 0 tapi account_id kosong", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Budi Santoso");
    fd.append("stock_id", "stock-123");
    fd.append("price", "500000");
    fd.append("payment_amount", "200000");
    fd.append("account_id", "");

    const result = await createPenjualan(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pilih rekening tujuan");
  });

  it("mengembalikan structured error jika payment_amount melebihi harga deal", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Budi Santoso");
    fd.append("stock_id", "stock-123");
    fd.append("price", "500000");
    fd.append("payment_amount", "600000");
    fd.append("account_id", "acc-bca");

    const result = await createPenjualan(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("tidak boleh melebihi harga deal");
  });
});

describe("Transaksi Tukar Tambah Validation & Error Protection", () => {
  it("mengembalikan structured error jika data aset barter kosong tanpa throw", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Ahmad");
    fd.append("stock_out_id", "stock-456");
    fd.append("price_out", "1000000");
    fd.append("tt_desc", "");
    fd.append("tt_value", "0");

    const result = await createTukarTambah(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("wajib diisi lengkap");
  });

  it("mengembalikan structured error jika ada pembayaran tunai tanpa rekening tanpa throw", async () => {
    const fd = new FormData();
    fd.append("customer_name", "Ahmad");
    fd.append("stock_out_id", "stock-456");
    fd.append("price_out", "1000000");
    fd.append("tt_desc", "Akun MLBB Smurf");
    fd.append("tt_value", "600000");
    fd.append("payment_amount", "400000");
    fd.append("account_id", "");

    const result = await createTukarTambah(fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Rekening tujuan/sumber wajib dipilih");
  });
});
