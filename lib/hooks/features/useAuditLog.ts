import { useState, useEffect, useCallback, useTransition } from "react";
import { getAuditLogs, AuditLogFilters, AuditLogResult } from "@/app/actions/audit-log";
import { AuditLog } from "@/types/database";

export type AuditLogWithUser = AuditLog & { public_users?: { full_name?: string | null } | null };

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  const loadData = useCallback(async (filters: AuditLogFilters = {}) => {
    setIsLoading(true);
    try {
      const result = (await getAuditLogs(filters)) as AuditLogResult;
      setLogs((result.data as unknown as AuditLogWithUser[]) || []);
      setPagination({
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAuditLogs({ page: 1, pageSize: 50 })
      .then((result) => {
        if (!active) return;
        const res = result as AuditLogResult;
        setLogs((res.data as unknown as AuditLogWithUser[]) || []);
        setPagination({
          total: res.total,
          page: res.page,
          pageSize: res.pageSize,
          totalPages: res.totalPages,
        });
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    loadData({ page: nextPage, pageSize: pagination.pageSize });
  };

  const handlePageSizeChange = (size: number) => {
    if (size === pagination.pageSize) return;
    loadData({ page: 1, pageSize: size });
  };

  const startFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return {
    data: {
      logs,
      pagination,
      startFrom,
      endTo,
    },
    isLoading,
    actions: {
      handlePageChange,
      handlePageSizeChange,
      loadData: (filters?: AuditLogFilters) => startTransition(() => loadData(filters)),
    },
  };
}
