/**
 * Shared type definitions for the vector-worker module.
 *
 * This module centralizes all TypeScript interfaces and type aliases
 * used across the worker to ensure consistency and single source of truth.
 */

/**
 * Cloudflare Worker environment bindings.
 *
 * Extend this interface when adding new bindings (KV, Queue, D1, etc).
 */
export interface Env {
	/** Supabase project URL */
	SUPABASE_URL: string;
	/** Supabase service role key for privileged database access */
	SUPABASE_SERVICE_ROLE_KEY: string;
	/** Secret for manual backfill trigger endpoint */
	BACKFILL_SECRET?: string;
	/** HMAC secret for verifying incoming Supabase webhooks */
	VECTOR_WEBHOOK_SECRET?: string;
	/** Cloudflare Queue binding for main vector processing */
	inventory_vector_queue?: Queue;
	/** Cloudflare Queue binding for dead-letter queue */
	inventory_vector_dlq?: Queue;
}

/**
 * Message payload sent through the inventory-vector-queue.
 *
 * Each message represents a single database record change that needs
 * to be processed into a vector embedding.
 */
export interface VectorQueueMessage {
	/** Unique identifier of the record to vectorize */
	recordId: string;
	/** Source table name (e.g., "inventory", "products") */
	table: string;
	/** Type of database operation that triggered this message */
	operation: "INSERT" | "UPDATE" | "DELETE";
	/** ISO timestamp when the change occurred */
	timestamp: string;
}

/**
 * Result returned by backfill and vectorization operations.
 */
export interface OperationResult {
	/** Number of rows/records processed */
	rows: number;
	/** Duration in milliseconds */
	durationMs: number;
}

/**
 * Result returned by single-record vectorization.
 */
export interface VectorizeResult extends OperationResult {
	/** The record ID that was vectorized */
	recordId: string;
}
