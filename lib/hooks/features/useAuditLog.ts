import { useState, useEffect, useCallback, useTransition } from "react";
import {
  getAuditLogs,
  exportAuditLogsToCsv,
  AuditLogFilters,
  AuditLogResult,
} from "@/app/actions/audit-log";
import { AuditLog } from "@/types/database";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

export type AuditLogWithUser = AuditLog & { public_users?: { full_name?: string | null } | null };

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [, startTransition] = useTransition();

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadData = useCallback(
    async (overrideFilters: AuditLogFilters = {}) => {
      setIsLoading(true);
      try {
        const activeFilters: AuditLogFilters = {
          page: overrideFilters.page ?? pagination.page,
          pageSize: overrideFilters.pageSize ?? pagination.pageSize,
          search: overrideFilters.search !== undefined ? overrideFilters.search : debouncedSearch,
          module: overrideFilters.module !== undefined ? overrideFilters.module : selectedModule,
          action: overrideFilters.action !== undefined ? overrideFilters.action : selectedAction,
          dateRange:
            overrideFilters.dateRange !== undefined ? overrideFilters.dateRange : dateRange,
        };

        const result = (await getAuditLogs(activeFilters)) as AuditLogResult;
        setLogs((result.data as unknown as AuditLogWithUser[]) || []);
        setPagination({
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
      } catch (err) {
        console.error("Error loading audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      debouncedSearch,
      selectedModule,
      selectedAction,
      dateRange,
      pagination.page,
      pagination.pageSize,
    ],
  );

  // Sync effect when debouncedSearch, selectedModule, selectedAction, or dateRange changes
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getAuditLogs({
      page: 1,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      module: selectedModule,
      action: selectedAction,
      dateRange,
    })
      .then((result) => {
        if (!active) return;
        const res = result as AuditLogResult;
        setLogs((res.data as unknown as AuditLogWithUser[]) || []);
        setPagination({
          total: res.total,
          page: 1,
          pageSize: res.pageSize,
          totalPages: res.totalPages,
        });
      })
      .catch((err) => {
        console.error("Error fetching audit logs:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedModule, selectedAction, dateRange, pagination.pageSize]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    loadData({
      page: nextPage,
      pageSize: pagination.pageSize,
      search: debouncedSearch,
      module: selectedModule,
      action: selectedAction,
      dateRange,
    });
  };

  const handlePageSizeChange = (size: number) => {
    if (size === pagination.pageSize) return;
    loadData({
      page: 1,
      pageSize: size,
      search: debouncedSearch,
      module: selectedModule,
      action: selectedAction,
      dateRange,
    });
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await exportAuditLogsToCsv({
        search: debouncedSearch,
        module: selectedModule,
        action: selectedAction,
        dateRange,
      });

      if (res.error || !res.csvContent) {
        alert(res.error || "Gagal mengunduh CSV");
        return;
      }

      // Create blob and download link
      const blob = new Blob(["\ufeff" + res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Audit_Logs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV Error:", err);
    } finally {
      setIsExporting(false);
    }
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
    filters: {
      search,
      selectedModule,
      selectedAction,
      dateRange,
    },
    isLoading,
    isExporting,
    actions: {
      setSearch,
      setSelectedModule,
      setSelectedAction,
      setDateRange,
      handlePageChange,
      handlePageSizeChange,
      handleExportCsv,
      loadData: (filters?: AuditLogFilters) => startTransition(() => loadData(filters)),
    },
  };
}
