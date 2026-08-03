import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60000);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runOnce() {
  const started = Date.now();
  try {
    const { data, error } = await supabase.rpc("backfill_inventory_vectors");
    if (error) throw error;
    console.log(
      `[${new Date().toISOString()}] backfilled ${data} row(s) in ${Date.now() - started}ms`,
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] backfill failed: ${err.message}`);
  }
}

console.log(
  `[${new Date().toISOString()}] inventory vector worker started; poll every ${POLL_INTERVAL_MS}ms`,
);
await runOnce();
setInterval(runOnce, POLL_INTERVAL_MS);
