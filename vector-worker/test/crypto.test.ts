import { describe, it, expect } from "vitest";
import { signWebhook, verifyWebhook } from "../src/crypto";

describe("webhook crypto", () => {
  const secret = "test-webhook-secret";
  const payload = '{"record":{"id":"abc123"},"table":"inventory","type":"INSERT"}';

  it("menandatangani payload dan menghasilkan format sha256=<hex>", async () => {
    const signature = await signWebhook(secret, payload);
    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("verifikasi berhasil dengan signature yang valid", async () => {
    const signature = await signWebhook(secret, payload);
    const valid = await verifyWebhook(secret, payload, signature);
    expect(valid).toBe(true);
  });

  it("verifikasi gagal jika signature tidak cocok", async () => {
    const valid = await verifyWebhook(secret, payload, "sha256=invalid");
    expect(valid).toBe(false);
  });

  it("verifikasi gagal jika secret kosong", async () => {
    const signature = await signWebhook(secret, payload);
    const valid = await verifyWebhook("", payload, signature);
    expect(valid).toBe(false);
  });

  it("verifikasi gagal jika signature header null", async () => {
    const valid = await verifyWebhook(secret, payload, null);
    expect(valid).toBe(false);
  });

  it("menghasilkan signature yang berbeda untuk payload berbeda", async () => {
    const sig1 = await signWebhook(secret, payload);
    const sig2 = await signWebhook(secret, payload + " ");
    expect(sig1).not.toBe(sig2);
  });
});
