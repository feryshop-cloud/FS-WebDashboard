import { describe, it, expect, vi, beforeEach } from "vitest";
import { processInventoryQueue, processDeadLetterQueue } from "../src/queue";

const mockRunVectorizeRecord = vi.fn();

vi.mock("../src/vectorize", () => ({
	runVectorizeRecord: (...args: any[]) => mockRunVectorizeRecord(...args),
}));

describe("queue processing", () => {
	let env: any;

	beforeEach(() => {
		env = {};
		mockRunVectorizeRecord.mockReset();
	});

	describe("processInventoryQueue", () => {
		it("memproses semua pesan dan ack jika berhasil", async () => {
			mockRunVectorizeRecord.mockResolvedValue({
				recordId: "rec-1",
				rows: 1,
				durationMs: 10,
			});

			const messages = [
				{ body: { recordId: "rec-1", table: "inventory", operation: "INSERT" as const, timestamp: "2026-01-01T00:00:00Z" }, ack: vi.fn(), retry: vi.fn() },
				{ body: { recordId: "rec-2", table: "inventory", operation: "UPDATE" as const, timestamp: "2026-01-01T00:00:00Z" }, ack: vi.fn(), retry: vi.fn() },
			];

			const batch = {
				queue: "inventory-vector-queue",
				messages,
			} as any;

			await processInventoryQueue(batch, env);

			expect(mockRunVectorizeRecord).toHaveBeenCalledTimes(2);
			expect(mockRunVectorizeRecord).toHaveBeenCalledWith(env, "rec-1");
			expect(mockRunVectorizeRecord).toHaveBeenCalledWith(env, "rec-2");
			expect(messages[0].ack).toHaveBeenCalled();
			expect(messages[1].ack).toHaveBeenCalled();
			expect(messages[0].retry).not.toHaveBeenCalled();
			expect(messages[1].retry).not.toHaveBeenCalled();
		});

		it("memanggil retry jika vectorisasi gagal", async () => {
			mockRunVectorizeRecord.mockRejectedValue(new Error("RPC failed"));

			const messages = [
				{ body: { recordId: "rec-1", table: "inventory", operation: "INSERT" as const, timestamp: "2026-01-01T00:00:00Z" }, ack: vi.fn(), retry: vi.fn() },
			];

			const batch = {
				queue: "inventory-vector-queue",
				messages,
			} as any;

			await processInventoryQueue(batch, env);

			expect(messages[0].retry).toHaveBeenCalled();
			expect(messages[0].ack).not.toHaveBeenCalled();
		});
	});

	describe("processDeadLetterQueue", () => {
		it("meng-ack semua pesan DLQ", async () => {
			const messages = [
				{ body: { recordId: "rec-1", table: "inventory", operation: "INSERT" as const, timestamp: "2026-01-01T00:00:00Z" }, ack: vi.fn() },
				{ body: { recordId: "rec-2", table: "inventory", operation: "UPDATE" as const, timestamp: "2026-01-01T00:00:00Z" }, ack: vi.fn() },
			];

			const batch = {
				queue: "inventory-vector-dlq",
				messages,
			} as any;

			await processDeadLetterQueue(batch, env);

			expect(messages[0].ack).toHaveBeenCalled();
			expect(messages[1].ack).toHaveBeenCalled();
		});
	});
});
