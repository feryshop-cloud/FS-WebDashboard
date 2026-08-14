import { describe, expect, it } from "vitest";
import { InventoryFormSchema, LoginSchema } from "@/lib/schemas";

describe("LoginSchema", () => {
  it("menerima email & password valid", () => {
    const result = LoginSchema.safeParse({
      email: "admin@feryshop.test",
      password: "rahasia123",
    });
    expect(result.success).toBe(true);
  });

  it("menolak email invalid", () => {
    const result = LoginSchema.safeParse({
      email: "bukan-email",
      password: "rahasia123",
    });
    expect(result.success).toBe(false);
  });

  it("menolak password < 6 karakter", () => {
    const result = LoginSchema.safeParse({
      email: "admin@feryshop.test",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("InventoryFormSchema", () => {
  const valid = {
    game_id: "0e5a8f7c-3b1d-4e2a-9f4c-6d8b2a1c4e5f",
    account_specs: "Akun level 100, skin lengkap, email terverifikasi",
    capital_price: "500000",
    asking_price: "750000",
  };

  it("menerima input inventori valid", () => {
    expect(InventoryFormSchema.safeParse(valid).success).toBe(true);
  });

  it("menerima harga string (coerce)", () => {
    const result = InventoryFormSchema.safeParse(valid);
    if (result.success) {
      expect(result.data.capital_price).toBe(500000);
      expect(result.data.asking_price).toBe(750000);
    }
  });

  it("menolak game_id non-uuid", () => {
    const result = InventoryFormSchema.safeParse({ ...valid, game_id: "abc" });
    expect(result.success).toBe(false);
  });

  it("menolak capital_price nol/negatif", () => {
    const result = InventoryFormSchema.safeParse({ ...valid, capital_price: "0" });
    expect(result.success).toBe(false);
  });

  it("menolak account_specs terlalu pendek", () => {
    const result = InventoryFormSchema.safeParse({ ...valid, account_specs: "pendek" });
    expect(result.success).toBe(false);
  });
});
