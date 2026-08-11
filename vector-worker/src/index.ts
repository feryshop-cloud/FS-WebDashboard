import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BACKFILL_SECRET?: string;
}

async function runBackfill(env: Env) {
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

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runBackfill(env)
        .then((result) => {
          console.log(
            `[${new Date().toISOString()}] backfilled ${result.rows} row(s) in ${result.durationMs}ms`,
          );
        })
        .catch((error) => {
          console.error(`[${new Date().toISOString()}] backfill failed: ${error.message}`);
        }),
    );
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

      console.log("Manual trigger via /__backfill");
      try {
        const result = await runBackfill(env);
        return new Response(JSON.stringify({ ok: true, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
