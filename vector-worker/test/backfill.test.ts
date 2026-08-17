import { describe, it, expect, vi, beforeEach } from "vitest";
import { runBackfill } from "../src/backfill";

let mockCreateClient: any;

describe("backfill", () => {
  let env: any;

  beforeEach(() => {
    vi.resetModules();
    env = {
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-key",
    };

    mockCreateClient = vi.fn(() => ({
      rpc: vi.fn(),
    }));

    vi.mock("@supabase/supabase-js", () => ({
      createClient: (...args: any[]) => mockCreateClient(...args),
    }));
  });

  it("memanggil RPC backfill_inventory_vectors dan mengembalikan hasil", async () => {
    const mockRpc = {
      data: [1, 2, 3],
      error: null,
    };

    mockCreateClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue(mockRpc),
    });

    const { runBackfill: run } = await import("../src/backfill");
    const result = await run(env);

    expect(mockCreateClient).toHaveBeenCalledWith(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(result.rows).toEqual([1, 2, 3]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("melempar error jika RPC gagal", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "RPC error" } }),
    });

    const { runBackfill: run } = await import("../src/backfill");
    await expect(run(env)).rejects.toThrow("RPC error");
  });

  it("melempar error jika SUPABASE_URL atau SERVICE_ROLE_KEY tidak ada", async () => {
    env.SUPABASE_URL = "";
    const { runBackfill: run } = await import("../src/backfill");
    await expect(run(env)).rejects.toThrow("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  });
});
