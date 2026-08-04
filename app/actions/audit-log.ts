"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getAuditLogs() {
  return runAction("getAuditLogs", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        `
          *,
          users (full_name)
        `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching audit logs", { error });
      return [];
    }
    return data;
  });
}