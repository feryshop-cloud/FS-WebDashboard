/**
 * Supabase webhook handler for real-time vector processing.
 *
 * This module handles incoming webhook requests from Supabase,
 * verifies their authenticity using HMAC-SHA256 signatures,
 * and enqueues record IDs for asynchronous vectorization.
 */

import { logger } from "./utils/logger";
import { signWebhook, verifyWebhook } from "./crypto";
import type { Env, VectorQueueMessage } from "./types";

/**
 * Handles an incoming Supabase webhook request.
 *
 * Verifies the HMAC signature, parses the payload to extract the
 * record ID, and sends it to the inventory-vector-queue for processing.
 *
 * @param request - The incoming HTTP request
 * @param env - Cloudflare Worker environment bindings
 * @returns HTTP response indicating success or failure
 */
export async function handleSupabaseWebhook(request: Request, env: Env): Promise<Response> {
	const rawBody = await request.text();
	const signature = request.headers.get("x-webhook-signature");

	const valid = await verifyWebhook(env.VECTOR_WEBHOOK_SECRET || "", rawBody, signature);
	if (!valid) {
		logger.warn("webhook signature verification failed");
		return new Response("Unauthorized", { status: 401 });
	}

	let payload: any;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return new Response("Bad Request", { status: 400 });
	}

	const recordId = payload?.record?.id;
	if (!recordId) {
		return new Response("Bad Request: missing record.id", { status: 400 });
	}

	const message: VectorQueueMessage = {
		recordId,
		table: payload.table || "",
		operation: payload.type || "INSERT",
		timestamp: new Date().toISOString(),
	};

	if (env.inventory_vector_queue) {
		await env.inventory_vector_queue.send(message);
		logger.info("enqueued record", { recordId, table: message.table, operation: message.operation });
	}

	return new Response("OK", { status: 200 });
}

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 *
 * This function is exposed for testing purposes or for external
 * systems that need to generate valid signatures.
 *
 * @param secret - The shared secret key
 * @param rawBody - The raw request body string
 * @returns The signature in the format `sha256=<hex-encoded-signature>`
 */
export async function generateWebhookSignature(secret: string, rawBody: string): Promise<string> {
	return signWebhook(secret, rawBody);
}
