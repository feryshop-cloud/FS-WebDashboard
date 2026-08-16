/**
 * Vector Worker — Main Entry Point
 *
 * Cloudflare Worker that maintains vector embeddings for inventory data.
 *
 * Architecture:
 * - **Webhook ingestion**: Supabase sends real-time change events to `/webhooks/supabase`
 * - **Queue processing**: Record IDs are enqueued and processed asynchronously via Cloudflare Queues
 * - **Daily reconciliation**: Cron job runs at midnight UTC to backfill any missed records
 *
 * Data flow:
 * ```
 * Supabase DB change → Webhook → Queue → RPC: create_inventory_vector
 *                                      ↓
 *                              Daily cron: backfill_inventory_vectors
 * ```
 */

import { logger, setRequestId } from "./utils/logger";
import { handleSupabaseWebhook } from "./webhook";
import { processInventoryQueue, processDeadLetterQueue } from "./queue";
import { runBackfill } from "./backfill";
import type { Env, VectorQueueMessage } from "./types";

export default {
	/**
	 * Scheduled handler — runs daily at midnight UTC.
	 *
	 * Executes a full backfill reconciliation to ensure all inventory
	 * records have up-to-date vector embeddings, catching any that
	 * were missed by the webhook queue.
	 */
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(
			runBackfill(env)
				.then((result) => {
					logger.info("daily backfill completed", { rows: result.rows, durationMs: result.durationMs });
				})
				.catch((error) => {
					logger.error("daily backfill failed", { error: error.message });
				}),
		);
	},

	/**
	 * Fetch handler — processes incoming HTTP requests.
	 *
	 * Routes:
	 * - `GET /__health` — Health check endpoint
	 * - `POST /__backfill` — Manual backfill trigger (requires BACKFILL_SECRET)
	 * - `POST /webhooks/supabase` — Supabase webhook endpoint (requires HMAC signature)
	 * - `*` — Returns 404
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const requestId = request.headers.get("x-request-id") || undefined;
		setRequestId(requestId);
		const url = new URL(request.url);

		if (url.pathname === "/__health") {
			return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		if (url.pathname === "/__backfill" && request.method === "POST") {
			const expectedSecret = env.BACKFILL_SECRET;
			const authHeader = request.headers.get("Authorization")?.trim();
			const token = authHeader?.startsWith("Bearer ")
				? authHeader.slice(7).trim()
				: request.headers.get("x-backfill-token")?.trim();

			if (expectedSecret && token !== expectedSecret) {
				return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});
			}

			logger.info("manual trigger via /__backfill");
			try {
				const result = await runBackfill(env);
				return new Response(JSON.stringify({ ok: true, ...result }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err: any) {
				logger.error("manual backfill failed", { error: err.message });
				return new Response(JSON.stringify({ ok: false, error: err.message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		if (url.pathname === "/webhooks/supabase" && request.method === "POST") {
			return handleSupabaseWebhook(request, env);
		}

		return new Response("Not found", { status: 404 });
	},

	/**
	 * Queue handler — processes messages from Cloudflare Queues.
	 *
	 * Routes:
	 * - `inventory-vector-queue` — Processes individual record vectorization
	 * - `inventory-vector-dlq` — Acknowledges dead-lettered messages
	 */
	async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
		const queueName = batch.queue;
		if (queueName === "inventory-vector-queue") {
			await processInventoryQueue(batch as MessageBatch<VectorQueueMessage>, env);
		} else if (queueName === "inventory-vector-dlq") {
			await processDeadLetterQueue(batch as MessageBatch<VectorQueueMessage>, env);
		} else {
			logger.warn("unknown queue", { queueName });
		}
	},
} satisfies ExportedHandler<Env>;
