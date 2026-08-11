"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types/database";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import { formatDate } from "@/lib/export-utils";

export type AuditLogFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  module?: string;
  action?: string;
  dateRange?: string; // 'ALL' | 'TODAY' | '7DAYS' | '30DAYS'
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
    const {
      page = 1,
      pageSize = 50,
      search,
      module: moduleFilter,
      action: actionFilter,
      dateRange,
    } = filters;
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("audit_logs").select(
      `
          id,
          user_id,
          role_name,
          action,
          module,
          description,
          related_id,
          ip_address,
          created_at,
          public_users (full_name)
        `,
      { count: "estimated" },
    );

    // Apply Search Filter (ilike on description, module, action, or role_name)
    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query = query.or(
        `description.ilike.${term},module.ilike.${term},action.ilike.${term},role_name.ilike.${term}`,
      );
    }

    // Apply Module Filter
    if (moduleFilter && moduleFilter !== "ALL") {
      query = query.eq("module", moduleFilter);
    }

    // Apply Action Filter
    if (actionFilter && actionFilter !== "ALL") {
      query = query.eq("action", actionFilter);
    }

    // Apply Date Range Filter
    if (dateRange && dateRange !== "ALL") {
      const now = new Date();
      if (dateRange === "TODAY") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte("created_at", startOfDay);
      } else if (dateRange === "7DAYS") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", sevenDaysAgo);
      } else if (dateRange === "30DAYS") {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", thirtyDaysAgo);
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error("Error fetching audit logs", { error });
      return { data: [], total: 0, page, pageSize, totalPages: 1 };
    }

    const fetchedData = (data as unknown as AuditLog[]) || [];
    const totalCount = count ?? fetchedData.length;

    return {
      data: fetchedData,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  });
}

/**
 * Server action to export filtered audit logs to CSV string format
 */
export async function exportAuditLogsToCsv(
  filters: Omit<AuditLogFilters, "page" | "pageSize"> = {},
): Promise<{ csvContent?: string; error?: string }> {
  return runAction("exportAuditLogsToCsv", async () => {
    const { search, module: moduleFilter, action: actionFilter, dateRange } = filters;
    const supabase = await createClient();

    let query = supabase.from("audit_logs").select(
      `
          id,
          user_id,
          role_name,
          action,
          module,
          description,
          ip_address,
          created_at,
          public_users (full_name)
        `,
    );

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      query = query.or(
        `description.ilike.${term},module.ilike.${term},action.ilike.${term},role_name.ilike.${term}`,
      );
    }

    if (moduleFilter && moduleFilter !== "ALL") {
      query = query.eq("module", moduleFilter);
    }

    if (actionFilter && actionFilter !== "ALL") {
      query = query.eq("action", actionFilter);
    }

    if (dateRange && dateRange !== "ALL") {
      const now = new Date();
      if (dateRange === "TODAY") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte("created_at", startOfDay);
      } else if (dateRange === "7DAYS") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", sevenDaysAgo);
      } else if (dateRange === "30DAYS") {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", thirtyDaysAgo);
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1000);

    if (error) {
      logger.error("Error exporting audit logs", { error });
      return { error: "Gagal mengekspor audit log." };
    }

    const logs =
      (data as unknown as (AuditLog & { public_users?: { full_name?: string | null } | null })[]) ||
      [];

    const headers = ["Waktu", "User", "Role", "Modul", "Aksi", "Keterangan", "IP Address"];

    const escapeCsvField = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const cleanStr = String(val).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const csvRows = logs.map((log) =>
      [
        escapeCsvField(formatDate(log.created_at)),
        escapeCsvField(log.public_users?.full_name || "System / Deleted User"),
        escapeCsvField(log.role_name || "-"),
        escapeCsvField(log.module),
        escapeCsvField(log.action),
        escapeCsvField(log.description || "-"),
        escapeCsvField(log.ip_address || "-"),
      ].join(","),
    );

    const csvContent = [headers.map(escapeCsvField).join(","), ...csvRows].join("\n");

    return { csvContent };
  });
}

/**
 * Server action to fetch detail data (old_data and new_data) for a single audit log
 */
export async function getAuditLogDetails(
  id: string,
): Promise<{ old_data: any; new_data: any; error?: string } | null> {
  return runAction("getAuditLogDetails", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("old_data, new_data")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching audit log details", { id, error });
      return { old_data: null, new_data: null, error: error.message };
    }

    return {
      old_data: data?.old_data,
      new_data: data?.new_data,
    };
  });
}
