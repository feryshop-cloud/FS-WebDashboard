import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSupabaseWebhook, generateWebhookSignature } from "../src/webhook";

describe("webhook handler", () => {
  const secret = "test-webhook-secret";
  const validPayload = JSON.stringify({
    record: { id: "record-123" },
    table: "inventory",
    type: "INSERT",
  });

  let env: any;

  beforeEach(() => {
    env = {
      VECTOR_WEBHOOK_SECRET: secret,
      inventory_vector_queue: {
        send: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it("menerima webhook dengan signature valid dan mengirim ke queue", async () => {
    const signature = await generateWebhookSignature(secret, validPayload);
    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: validPayload,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    expect(env.inventory_vector_queue.send).toHaveBeenCalledWith({
      recordId: "record-123",
      table: "inventory",
      operation: "INSERT",
      timestamp: expect.any(String),
    });
  });

  it("menolak webhook dengan signature tidak valid", async () => {
    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": "sha256=invalid",
      },
      body: validPayload,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(401);
    expect(env.inventory_vector_queue.send).not.toHaveBeenCalled();
  });

  it("menolak webhook tanpa signature header", async () => {
    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: validPayload,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(401);
  });

  it("menolak webhook tanpa record.id", async () => {
    const invalidPayload = JSON.stringify({
      record: {},
      table: "inventory",
      type: "INSERT",
    });
    const signature = await generateWebhookSignature(secret, invalidPayload);

    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: invalidPayload,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(400);
  });

  it("menolak webhook dengan JSON body yang tidak valid", async () => {
    const invalidBody = "not json";
    const signature = await generateWebhookSignature(secret, invalidBody);

    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: invalidBody,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(400);
  });

  it("skip queue jika binding tidak ada", async () => {
    env.inventory_vector_queue = undefined;
    const signature = await generateWebhookSignature(secret, validPayload);

    const request = new Request("http://example.com/webhooks/supabase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: validPayload,
    });

    const response = await handleSupabaseWebhook(request, env);
    expect(response.status).toBe(200);
  });
});
