import { describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";

describe("createAdminClient", () => {
  it("always throws a security violation error", () => {
    expect(() => createAdminClient()).toThrow("SECURITY VIOLATION");
  });

  it("mentions AI_GUARDRAILS in the error message", () => {
    expect(() => createAdminClient()).toThrow("AI_GUARDRAILS");
  });

  it("mentions SUPABASE_SERVICE_ROLE_KEY in the error message", () => {
    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("has return type never (always throws, never returns)", () => {
    let threw = false;
    try {
      createAdminClient();
    } catch (err) {
      threw = true;
      expect(err).toBeInstanceOf(Error);
    }
    expect(threw).toBe(true);
  });
});
