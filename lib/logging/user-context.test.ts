import { describe, expect, it } from "vitest";
import { userFromRequest } from "@/lib/logging/user-context";

/**
 * Build a minimal unsigned JWT with the given payload.
 * The signature segment is a dummy value — decodeJwtPayload only reads segment [1].
 */
function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");
  const body = Buffer.from(JSON.stringify(payload))
    .toString("base64url");
  return `${header}.${body}.fakesig`;
}

/**
 * Build a Supabase auth cookie value. The cookie stores a JSON array
 * where element [0] is the access token.
 */
function makeSupabaseCookieValue(accessToken: string): string {
  return JSON.stringify([accessToken]);
}

describe("userFromRequest", () => {
  it("extracts user id from a valid Supabase auth cookie (Headers object)", async () => {
    const token = makeJwt({ sub: "user-123", email: "a@b.com" });
    const cookieValue = makeSupabaseCookieValue(token);

    const h = new Headers();
    h.set("cookie", `sb-abc123-auth-token=${cookieValue}`);

    const user = await userFromRequest(h);
    expect(user).toEqual({ id: "user-123" });
  });

  it("extracts user id from a valid Supabase auth cookie (Record headers)", async () => {
    const token = makeJwt({ sub: "user-456" });
    const cookieValue = makeSupabaseCookieValue(token);

    const headers = { cookie: `sb-ref001-auth-token=${cookieValue}` };

    const user = await userFromRequest(headers);
    expect(user).toEqual({ id: "user-456" });
  });

  it("returns undefined when no Supabase auth cookie present", async () => {
    const h = new Headers();
    h.set("cookie", "session=somevalue; other=val");

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined for empty headers", async () => {
    const h = new Headers();
    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined when cookie value is not valid JSON", async () => {
    const h = new Headers();
    h.set("cookie", "sb-test-auth-token=not-json");

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined when JWT payload is malformed", async () => {
    const badToken = `header.${Buffer.from("not json!!!").toString("base64url")}.sig`;
    const cookieValue = makeSupabaseCookieValue(badToken);

    const h = new Headers();
    h.set("cookie", `sb-ref-auth-token=${cookieValue}`);

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined when JWT has fewer than 2 segments", async () => {
    const cookieValue = makeSupabaseCookieValue("onlyonepart");

    const h = new Headers();
    h.set("cookie", `sb-ref-auth-token=${cookieValue}`);

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined when token array has no access token", async () => {
    const h = new Headers();
    h.set("cookie", `sb-ref-auth-token=${JSON.stringify([])}`);

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("returns undefined when JWT sub claim is missing", async () => {
    const token = makeJwt({ email: "a@b.com" }); // no sub
    const cookieValue = makeSupabaseCookieValue(token);

    const h = new Headers();
    h.set("cookie", `sb-ref-auth-token=${cookieValue}`);

    const user = await userFromRequest(h);
    expect(user).toBeUndefined();
  });

  it("handles null/unknown input gracefully", async () => {
    expect(await userFromRequest(null)).toBeUndefined();
    expect(await userFromRequest(undefined)).toBeUndefined();
  });

  it("handles Record with Cookie (capitalized) key", async () => {
    const token = makeJwt({ sub: "user-789" });
    const cookieValue = makeSupabaseCookieValue(token);

    const headers = { Cookie: `sb-xyz-auth-token=${cookieValue}` };

    const user = await userFromRequest(headers);
    expect(user).toEqual({ id: "user-789" });
  });
});
