"use client";

import React, { useMemo } from "react";
import { Search, Filter, Calendar, ChevronDown, Download, Loader2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuditLog, AuditLogWithUser } from "@/lib/hooks/features/useAuditLog";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";

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

export default function AuditLogPage() {
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
    </div>
  );
}
