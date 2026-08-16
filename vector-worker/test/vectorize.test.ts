import { describe, it, expect, vi, beforeEach } from "vitest";

let mockCreateClient: any;

describe("vectorize", () => {
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

	it("memanggil RPC create_inventory_vector dengan record_id yang benar", async () => {
		const mockRpc = {
			data: 1,
			error: null,
		};

		mockCreateClient.mockReturnValue({
			rpc: vi.fn().mockResolvedValue(mockRpc),
		});

		const { runVectorizeRecord } = await import("../src/vectorize");
		const result = await runVectorizeRecord(env, "record-123");

		expect(mockCreateClient).toHaveBeenCalledWith(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: { autoRefreshToken: false, persistSession: false },
		});
		expect(result.recordId).toBe("record-123");
		expect(result.rows).toBe(1);
		expect(result.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("melempar error jika RPC gagal", async () => {
		mockCreateClient.mockReturnValue({
			rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "Vectorization failed" } }),
		});

		const { runVectorizeRecord } = await import("../src/vectorize");
		await expect(runVectorizeRecord(env, "record-123")).rejects.toThrow("Vectorization failed");
	});

	it("melempar error jika Supabase credentials tidak ada", async () => {
		env.SUPABASE_URL = "";
		const { runVectorizeRecord } = await import("../src/vectorize");
		await expect(runVectorizeRecord(env, "record-123")).rejects.toThrow("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
	});
});
