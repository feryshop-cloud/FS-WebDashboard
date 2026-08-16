/**
 * Cloudflare Queue consumer logic for vector processing.
 *
 * This module handles the consumption of messages from both the main
 * inventory-vector-queue and the inventory-vector-dlq (dead-letter queue).
 */

import { logger } from "./utils/logger";
import type { Env, VectorQueueMessage } from "./types";
import { runVectorizeRecord } from "./vectorize";

/**
 * Processes a batch of messages from the inventory-vector-queue.
 *
 * For each message, extracts the record ID and calls the vectorization
 * RPC. Messages are acknowledged on success or retried on failure.
 *
 * @param batch - The message batch from Cloudflare Queues
 * @param env - Cloudflare Worker environment bindings
 */
export async function processInventoryQueue(
	batch: MessageBatch<VectorQueueMessage>,
	env: Env,
): Promise<void> {
	for (const msg of batch.messages) {
		try {
			const result = await runVectorizeRecord(env, msg.body.recordId);
			logger.info("vectorized record", { recordId: result.recordId, durationMs: result.durationMs });
			msg.ack();
		} catch (error: any) {
			logger.error("vectorize record failed", { recordId: msg.body.recordId, error: error.message });
			msg.retry();
		}
	}
}

/**
 * Processes messages from the dead-letter queue (DLQ).
 *
 * Logs the dead-lettered message details and acknowledges them
 * to prevent reprocessing.
 *
 * @param batch - The message batch from the DLQ
 * @param env - Cloudflare Worker environment bindings
 */
export async function processDeadLetterQueue(
	batch: MessageBatch<VectorQueueMessage>,
	env: Env,
): Promise<void> {
	logger.warn("DLQ message received, acking", { queueSize: batch.messages.length });
	for (const msg of batch.messages) {
		logger.warn("dead-lettered message", {
			recordId: msg.body.recordId,
			table: msg.body.table,
			operation: msg.body.operation,
			timestamp: msg.body.timestamp,
		});
		msg.ack();
	}
}
