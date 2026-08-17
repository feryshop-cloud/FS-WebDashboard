import { describe, expect, it, vi, beforeEach } from "vitest";

// Use vi.hoisted so the mock object is available when vi.mock factories run
// (vi.mock is hoisted above top-level variable declarations).
const { mockLogger, mockHeadersGet, mockHeadersFn } = vi.hoisted(() => {
  const mockHeadersGet = vi.fn();
  const mockHeadersFn = vi.fn(async () => ({ get: mockHeadersGet }));
  return {
    mockLogger: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
    mockHeadersGet,
    mockHeadersFn,
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: mockHeadersFn,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

// Mock request-context — call fn directly (preserves real AsyncLocalStorage behavior
// isn't needed for these tests, we just need fn to execute)
vi.mock("@/lib/logging/request-context", () => ({
  runWithRequestId: (_requestId: string | undefined, fn: () => unknown) => fn(),
}));

import { runAction } from "@/lib/logging/server-action";

describe("runAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default implementation (clearAllMocks removes it)
    mockHeadersFn.mockImplementation(async () => ({ get: mockHeadersGet }));
  });

  it("returns the result of the action function", async () => {
    mockHeadersGet.mockReturnValue(null);

    const result = await runAction("getItems", async () => {
      return [1, 2, 3];
    });

    expect(result).toEqual([1, 2, 3]);
  });

  it("logs 'action completed' on success", async () => {
    mockHeadersGet.mockReturnValue(null);

    await runAction("getDeals", async () => "ok");

    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      "action completed",
      expect.objectContaining({
        context: "ServerAction: getDeals",
      }),
    );
  });

  it("includes durationMs in the completion log", async () => {
    mockHeadersGet.mockReturnValue(null);

    await runAction("slowAction", async () => {
      // Tiny delay to ensure durationMs > 0
      await new Promise((r) => setTimeout(r, 10));
      return "done";
    });

    const meta = mockLogger.debug.mock.calls[0][1];
    expect(typeof meta.durationMs).toBe("number");
    expect(meta.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("re-throws errors from the action function", async () => {
    mockHeadersGet.mockReturnValue(null);

    const err = new Error("db down");
    await expect(
      runAction("failingAction", async () => {
        throw err;
      }),
    ).rejects.toThrow("db down");
  });

  it("logs 'action failed' on error", async () => {
    mockHeadersGet.mockReturnValue(null);

    const err = new Error("oops");
    try {
      await runAction("badAction", async () => {
        throw err;
      });
    } catch {
      // expected
    }

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      "action failed",
      expect.objectContaining({
        context: "ServerAction: badAction",
        err,
      }),
    );
  });

  it("reads x-request-id from headers", async () => {
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === "x-request-id") return "req-abc-123";
      return null;
    });

    await runAction("testAction", async () => "ok");

    // The action should still complete successfully
    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
  });

  it("handles headers() failing gracefully (no request context)", async () => {
    // Override mock to throw (simulates static rendering context)
    mockHeadersFn.mockRejectedValueOnce(new Error("no request context"));

    const result = await runAction("staticAction", async () => "fallback");

    expect(result).toBe("fallback");
    expect(mockLogger.debug).toHaveBeenCalledTimes(1);
  });
});
