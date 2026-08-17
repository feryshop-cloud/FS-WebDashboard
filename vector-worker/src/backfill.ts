/**
 * Backfill and reconciliation logic for vector embeddings.
 *
 * This module handles bulk operations for ensuring all inventory records
 * have corresponding vector embeddings in the database.
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils/logger";
import type { Env, OperationResult } from "./types";

/**
 * Runs the full backfill reconciliation process.
 *
 * Calls the `backfill_inventory_vectors` Supabase RPC which processes
 * all inventory records that are missing or outdated vector embeddings.
 * This is intended to run on a daily schedule via cron.
 *
 * @param env - Cloudflare Worker environment bindings
 * @returns Operation result with row count and duration
 * @throws If Supabase client cannot be initialized or RPC call fails
 */
export async function runBackfill(env: Env): Promise<OperationResult> {
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
  const { data, error } = await supabase.rpc("backfill_inventory_vectors");
  if (error) throw error;

  return {
    rows: data,
    durationMs: Date.now() - started,
  };
}
