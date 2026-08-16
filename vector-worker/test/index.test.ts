import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../src/index";

// Mock modules
vi.mock("../src/backfill", () => ({
	runBackfill: vi.fn(),
}));

vi.mock("../src/vectorize", () => ({
	runVectorizeRecord: vi.fn(),
}));

vi.mock("../src/webhook", () => ({
	handleSupabaseWebhook: vi.fn(),
	generateWebhookSignature: vi.fn(),
}));

vi.mock("../src/queue", () => ({
	processInventoryQueue: vi.fn(),
	processDeadLetterQueue: vi.fn(),
}));

import { runBackfill } from "../src/backfill";
import { handleSupabaseWebhook } from "../src/webhook";
import { processInventoryQueue, processDeadLetterQueue } from "../src/queue";

describe("vector-worker integration", () => {
	let env: any;

	beforeEach(() => {
		vi.resetAllMocks();
		env = {
			SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-key",
			BACKFILL_SECRET: "test-backfill-secret",
			VECTOR_WEBHOOK_SECRET: "test-webhook-secret",
			inventory_vector_queue: undefined,
			inventory_vector_dlq: undefined,
		};
	});

	describe("fetch handler", () => {
		it("mengembalikan health check", async () => {
			const request = new Request("http://example.com/__health", { method: "GET" } as any);
			const response = await worker.fetch(request, env);
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body.ok).toBe(true);
			expect(body.timestamp).toBeDefined();
		});

		it("mengembalikan 404 untuk route yang tidak diketahui", async () => {
			const request = new Request("http://example.com/unknown", { method: "GET" } as any);
			const response = await worker.fetch(request, env);
			expect(response.status).toBe(404);
		});

		it("menolak /__backfill tanpa token", async () => {
			const request = new Request("http://example.com/__backfill", { method: "POST" } as any);
			const response = await worker.fetch(request, env);
			expect(response.status).toBe(401);
		});

		it("menolak /__backfill dengan token yang salah", async () => {
			const request = new Request("http://example.com/__backfill", {
				method: "POST",
				headers: { Authorization: "Bearer wrong-token" },
			} as any);
			const response = await worker.fetch(request, env);
			expect(response.status).toBe(401);
		});

		it("menerima /__backfill dengan token yang benar", async () => {
			(runBackfill as any).mockResolvedValue({ rows: 5, durationMs: 100 });

			const request = new Request("http://example.com/__backfill", {
				method: "POST",
				headers: { Authorization: "Bearer test-backfill-secret" },
			} as any);

			const response = await worker.fetch(request, env);
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(body.ok).toBe(true);
			expect(body.rows).toBe(5);
			expect(runBackfill).toHaveBeenCalledWith(env);
		});

		it("meneruskan /webhooks/supabase ke handleSupabaseWebhook", async () => {
			const request = new Request("http://example.com/webhooks/supabase", { method: "POST" } as any);
			(handleSupabaseWebhook as any).mockResolvedValue(new Response("OK", { status: 200 }));

			const response = await worker.fetch(request, env);

			expect(handleSupabaseWebhook).toHaveBeenCalledWith(request, env);
			expect(response.status).toBe(200);
		});
	});

	describe("queue handler", () => {
		it("merutekan pesan inventory-vector-queue ke processInventoryQueue", async () => {
			const batch = {
				queue: "inventory-vector-queue",
				messages: [{ body: { recordId: "rec-1" } as any }],
			} as any;

			await worker.queue(batch, env);

			expect(processInventoryQueue).toHaveBeenCalledWith(batch, env);
			expect(processDeadLetterQueue).not.toHaveBeenCalled();
		});

		it("merutekan pesan inventory-vector-dlq ke processDeadLetterQueue", async () => {
			const batch = {
				queue: "inventory-vector-dlq",
				messages: [{ body: { recordId: "rec-1" } as any }],
			} as any;

			await worker.queue(batch, env);

			expect(processDeadLetterQueue).toHaveBeenCalledWith(batch, env);
			expect(processInventoryQueue).not.toHaveBeenCalled();
		});

		it("logging warning untuk queue yang tidak diketahui", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const batch = {
				queue: "unknown-queue",
				messages: [],
			} as any;

			await worker.queue(batch, env);

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
