"use client";

import React, { useMemo } from "react";
import { Search, Filter, Calendar, ChevronDown, Download, Loader2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuditLog, AuditLogWithUser } from "@/lib/hooks/features/useAuditLog";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { getAuditLogDetails } from "@/app/actions/audit-log";

const PAGE_SIZES = [25, 50, 100, 200];

const MODULE_OPTIONS = [
  { value: "ALL", label: "Semua Modul" },
  { value: "products", label: "Products" },
  { value: "stocks", label: "Stocks" },
  { value: "deals", label: "Deals" },
  { value: "users", label: "Users & Roles" },
  { value: "auth", label: "Authentication" },
  { value: "settings", label: "Settings" },
  { value: "payments", label: "Payments" },
  { value: "finance_ledger", label: "Finance Ledger" },
  { value: "problem_cases", label: "Problem Cases" },
  { value: "categories", label: "Categories" },
  { value: "email_accounts", label: "Email Accounts" },
  { value: "orders", label: "Orders" },
];

const ACTION_OPTIONS = [
  { value: "ALL", label: "Semua Aksi" },
  { value: "CREATE", label: "CREATE" },
  { value: "INSERT", label: "INSERT" },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
  { value: "LOGIN", label: "LOGIN" },
];

const DATE_RANGE_OPTIONS = [
  { value: "ALL", label: "Semua Waktu" },
  { value: "TODAY", label: "Hari Ini" },
  { value: "7DAYS", label: "7 Hari Terakhir" },
  { value: "30DAYS", label: "30 Hari Terakhir" },
];

function LogDiffView({ oldData, newData, action }: { oldData: any; newData: any; action: string }) {
  if (!oldData && !newData) {
    return (
      <p className="text-muted-foreground text-xs italic">Tidak ada perubahan data terekam.</p>
    );
  }

  const allKeys = Array.from(
    new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]),
  );

  // If INSERT/CREATE
  if (action === "CREATE" || action === "INSERT" || (!oldData && newData)) {
    return (
      <div className="space-y-3">
        <h4 className="text-foreground text-xs font-semibold">Data Baru (Created)</h4>
        <div className="border-border bg-muted/30 max-h-96 overflow-y-auto rounded-lg border p-3 font-mono text-xs">
          {Object.entries(newData || {}).map(([key, val]) => (
            <div key={key} className="py-1">
              <span className="font-semibold text-blue-600">{key}:</span>{" "}
              <span className="text-foreground">{JSON.stringify(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If DELETE
  if (action === "DELETE" || (oldData && !newData)) {
    return (
      <div className="space-y-3">
        <h4 className="text-foreground text-xs font-semibold">Data Dihapus (Deleted)</h4>
        <div className="border-border bg-muted/30 max-h-96 overflow-y-auto rounded-lg border p-3 font-mono text-xs">
          {Object.entries(oldData || {}).map(([key, val]) => (
            <div key={key} className="py-1">
              <span className="font-semibold text-rose-600">{key}:</span>{" "}
              <span className="text-foreground">{JSON.stringify(val)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If UPDATE / Both exist
  const diffs = allKeys.filter(
    (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-foreground text-xs font-semibold">Perubahan Kolom ({diffs.length})</h4>
        {diffs.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">Semua nilai kolom identik.</p>
        ) : (
          <div className="divide-border max-h-96 space-y-2.5 divide-y overflow-y-auto">
            {diffs.map((key) => (
              <div key={key} className="pt-2.5 first:pt-0">
                <div className="text-foreground font-mono text-xs font-bold">{key}</div>
                <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-xs">
                  <div
                    className="truncate rounded border border-rose-100 bg-rose-50 p-1.5 text-rose-800 line-through"
                    title={JSON.stringify(oldData[key])}
                  >
                    {oldData[key] !== undefined ? (
                      JSON.stringify(oldData[key])
                    ) : (
                      <span className="text-[10px] italic opacity-50">NULL</span>
                    )}
                  </div>
                  <div
                    className="truncate rounded border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-800"
                    title={JSON.stringify(newData[key])}
                  >
                    {newData[key] !== undefined ? (
                      JSON.stringify(newData[key])
                    ) : (
                      <span className="text-[10px] italic opacity-50">NULL</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible raw data */}
      <div className="border-border space-y-2 border-t pt-3">
        <details className="group">
          <summary className="text-muted-foreground group-hover:text-foreground cursor-pointer text-xs font-medium outline-none select-none">
            Lihat Raw JSON Data (Sebelum & Sesudah)
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 font-mono text-[10px] sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground mb-1 text-center font-bold">
                Sebelum (Old Data)
              </div>
              <pre className="border-border bg-muted/40 max-h-60 overflow-y-auto rounded-lg border p-2.5 whitespace-pre-wrap">
                {JSON.stringify(oldData, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-muted-foreground mb-1 text-center font-bold">
                Sesudah (New Data)
              </div>
              <pre className="border-border bg-muted/40 max-h-60 overflow-y-auto rounded-lg border p-2.5 whitespace-pre-wrap">
                {JSON.stringify(newData, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [selectedLog, setSelectedLog] = React.useState<AuditLogWithUser | null>(null);
  const [detailData, setDetailData] = React.useState<{ old_data: any; new_data: any } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = React.useState(false);

  const handleRowClick = async (log: AuditLogWithUser) => {
    setIsDrawerOpen(true);
    setSelectedLog(log);
    setIsDetailLoading(true);
    setDetailData(null);
    try {
      const details = await getAuditLogDetails(log.id);
      if (details) {
        setDetailData(details);
      }
    } catch (err) {
      console.error("Error loading audit log details:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsDrawerClosing(false);
      setSelectedLog(null);
      setDetailData(null);
    }, 300);
  };
  const {
    data: { logs, pagination },
    filters: { search, selectedModule, selectedAction, dateRange },
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
      loadData,
    },
  } = useAuditLog();

  const columns = useMemo<DataTableColumn<AuditLogWithUser>[]>(
    () => [
      {
        key: "created_at",
        header: "Waktu",
        className: "text-muted-foreground font-mono text-xs whitespace-nowrap py-2.5",
        headerClassName: "py-3",
        render: (log) => formatDate(log.created_at),
      },
      {
        key: "user",
        header: "User & Role",
        className: "text-foreground text-xs font-semibold whitespace-nowrap py-2.5",
        headerClassName: "py-3",
        render: (log) => (
          <>
            {log.public_users?.full_name || "System / Deleted User"}
            {log.role_name && (
              <span className="text-muted-foreground font-normal"> ({log.role_name})</span>
            )}
          </>
        ),
      },
      {
        key: "module",
        header: "Modul",
        className: "text-muted-foreground text-xs font-medium whitespace-nowrap py-2.5",
        headerClassName: "py-3",
        render: (log) => log.module,
      },
      {
        key: "action",
        header: "Aksi",
        className: "whitespace-nowrap py-2.5",
        headerClassName: "py-3",
        render: (log) => {
          let actionColor = "text-muted-foreground bg-muted";
          if (log.action === "CREATE" || log.action === "INSERT")
            actionColor = "text-emerald-700 bg-emerald-50";
          if (log.action === "UPDATE") actionColor = "text-blue-700 bg-blue-50";
          if (log.action === "DELETE") actionColor = "text-rose-700 bg-rose-50";
          if (log.action === "LOGIN") actionColor = "text-purple-700 bg-purple-50";

          return (
            <span
              className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${actionColor}`}
            >
              {log.action}
            </span>
          );
        },
      },
      {
        key: "description",
        header: "Keterangan Detail",
        className:
          "text-muted-foreground max-w-md truncate font-mono text-xs tracking-tight py-2.5",
        headerClassName: "py-3",
        render: (log) => <span title={log.description ?? undefined}>{log.description}</span>,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Catatan aktivitas admin, perubahan data, dan akses sistem (Read-only).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            title="Refresh Data"
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        {/* Search Bar with Debounce */}
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-muted text-foreground placeholder-placeholder block w-full rounded-lg border py-2 pr-3 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari keterangan aktivitas, modul, atau user..."
          />
        </div>

        {/* Filters */}
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          {/* Action Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="border-border bg-card text-foreground appearance-none rounded-lg border py-2 pr-8 pl-9 text-sm font-medium focus:border-blue-500 focus:outline-none"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="text-faint-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
            <ChevronDown className="text-faint-foreground pointer-events-none absolute top-2.5 right-2.5 h-4 w-4" />
          </div>

          {/* Module Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="border-border bg-card text-foreground appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm font-medium focus:border-blue-500 focus:outline-none"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="text-faint-foreground pointer-events-none absolute top-2.5 right-2.5 h-4 w-4" />
          </div>

          {/* Date Range Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border-border bg-card text-foreground appearance-none rounded-lg border py-2 pr-8 pl-9 text-sm font-medium focus:border-blue-500 focus:outline-none"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Calendar className="text-faint-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
            <ChevronDown className="text-faint-foreground pointer-events-none absolute top-2.5 right-2.5 h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Shared Reusable DataTable Component */}
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        emptyMessage="Belum ada catatan aktivitas."
        onRowClick={handleRowClick}
        footer={
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZES}
            itemLabel="catatan"
          />
        }
      />

      {/* Audit Log Details Slide-over Drawer */}
      {(isDrawerOpen || isDrawerClosing) && (
        <SlideOverDrawer
          open={isDrawerOpen}
          closing={isDrawerClosing}
          onClose={handleCloseDrawer}
          title="Detail Audit Log"
          subtitle="Informasi lengkap aktivitas dan perubahan data."
          labelledById="audit-log-drawer-title"
        >
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Metadata Grid */}
              <div className="border-border grid grid-cols-2 gap-4 border-b pb-5 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Waktu Aktivitas</span>
                  <span className="text-foreground mt-0.5 block font-mono font-medium">
                    {selectedLog ? formatDate(selectedLog.created_at) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">IP Address</span>
                  <span className="text-foreground mt-0.5 block font-mono">
                    {selectedLog?.ip_address || "-"}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground block font-medium">Operator / User</span>
                  <span
                    className="text-foreground mt-0.5 block truncate font-semibold"
                    title={selectedLog?.public_users?.full_name || "System"}
                  >
                    {selectedLog?.public_users?.full_name || "System / Deleted User"}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground block font-medium">Nama Role</span>
                  <span className="text-foreground mt-0.5 block">
                    {selectedLog?.role_name || "-"}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground block font-medium">Nama Modul</span>
                  <span className="text-foreground mt-0.5 block font-semibold">
                    {selectedLog?.module || "-"}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground block font-medium">Jenis Aksi</span>
                  <span className="text-foreground mt-0.5 block font-bold">
                    {selectedLog?.action || "-"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs font-medium">
                  Keterangan Aktivitas
                </span>
                <p className="text-foreground bg-muted/30 border-border-soft rounded-lg border p-3 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap">
                  {selectedLog?.description || "-"}
                </p>
              </div>

              {/* Diff Data Section */}
              <div className="border-border space-y-2 border-t pt-5">
                <span className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Detail Perubahan Data
                </span>
                {isDetailLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-muted-foreground text-xs">
                      Memuat detail perubahan data...
                    </span>
                  </div>
                ) : detailData ? (
                  <LogDiffView
                    oldData={detailData.old_data}
                    newData={detailData.new_data}
                    action={selectedLog?.action || ""}
                  />
                ) : (
                  <p className="text-xs text-rose-500 italic">Gagal memuat detail data.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-border bg-card border-t p-6">
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-bold shadow-sm transition-colors outline-none"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </SlideOverDrawer>
      )}
    </div>
  );
}
