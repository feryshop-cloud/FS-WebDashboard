"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types/database";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export type AuditLogFilters = {
  page?: number;
  pageSize?: number;
};

export type AuditLogResult = {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResult> {
  return runAction("getAuditLogs", async () => {
    const { page = 1, pageSize = 50 } = filters;
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("audit_logs")
      .select(
        `
          *,
          public_users (full_name)
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error("Error fetching audit logs", { error });
      return { data: [], total: 0, page, pageSize, totalPages: 1 };
    }

    return {
      data: (data as unknown as AuditLog[]) || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  });
}
