import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            SUPABASE_URL: "https://test.supabase.co",
            SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
            BACKFILL_SECRET: "test-backfill-secret",
            VECTOR_WEBHOOK_SECRET: "test-webhook-secret",
          },
        },
      },
    },
  },
});
