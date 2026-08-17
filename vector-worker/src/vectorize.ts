/**
 * Single-record vectorization logic.
 *
 * This module handles the processing of individual inventory records
 * into vector embeddings, typically triggered by queue messages
 * from real-time webhook events.
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";
import type { Env, VectorizeResult } from "./types";

/**
 * Vectorizes a single inventory record by its ID.
 *
 * Calls the `create_inventory_vector` Supabase RPC which generates
 * or updates the vector embedding for the specified record.
 *
 * @param env - Cloudflare Worker environment bindings
 * @param recordId - The unique identifier of the record to vectorize
 * @returns Operation result with record ID, row count, and duration
 * @throws If Supabase client cannot be initialized or RPC call fails
 */
export async function runVectorizeRecord(env: Env, recordId: string): Promise<VectorizeResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const started = Date.now();
  const { data, error } = await supabase.rpc("create_inventory_vector", {
    p_record_id: recordId,
  });
  if (error) throw error;

  logger.debug("vectorize record RPC completed", {
    recordId,
    rows: data,
    durationMs: Date.now() - started,
  });

  return {
    recordId,
    rows: data,
    durationMs: Date.now() - started,
  };
}
