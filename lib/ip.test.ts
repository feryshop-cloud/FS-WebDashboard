import { describe, expect, it, vi, beforeEach } from "vitest";

// We must mock next/headers before importing getClientIp,
// because getClientIp dynamically imports it.
const mockHeaders = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

import { getClientIp } from "@/lib/ip";

describe("getClientIp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns x-real-ip when present (highest priority)", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-real-ip") return "10.0.0.1";
        if (name === "x-forwarded-for") return "1.2.3.4, 5.6.7.8";
        return null;
      },
    });

    const ip = await getClientIp();
    expect(ip).toBe("10.0.0.1");
  });

  it("trims whitespace from x-real-ip", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-real-ip") return "  10.0.0.1  ";
        return null;
      },
    });

    const ip = await getClientIp();
    expect(ip).toBe("10.0.0.1");
  });

  it("falls back to x-forwarded-for first IP when x-real-ip absent", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-real-ip") return null;
        if (name === "x-forwarded-for") return "1.2.3.4, 5.6.7.8, 9.10.11.12";
        return null;
      },
    });

    const ip = await getClientIp();
    expect(ip).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for first IP", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) => {
        if (name === "x-real-ip") return null;
        if (name === "x-forwarded-for") return "  203.0.113.5  , 10.0.0.1";
        return null;
      },
    });

    const ip = await getClientIp();
    expect(ip).toBe("203.0.113.5");
  });

  it("returns null when neither header is present", async () => {
    mockHeaders.mockResolvedValue({
      get: () => null,
    });

    const ip = await getClientIp();
    expect(ip).toBeNull();
  });

  it("returns null when headers() throws (static rendering context)", async () => {
    mockHeaders.mockRejectedValue(new Error("headers() called outside request context"));

    const ip = await getClientIp();
    expect(ip).toBeNull();
  });
});
