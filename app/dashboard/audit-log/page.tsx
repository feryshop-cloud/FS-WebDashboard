"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAuditLogs, AuditLogFilters, AuditLogResult } from "@/app/actions/audit-log";
import { AuditLog } from "@/types/database";

type AuditLogWithUser = AuditLog & { public_users?: { full_name?: string | null } | null };

const PAGE_SIZES = [25, 50, 100, 200];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData({ page: 1, pageSize: 50 });
  }, [loadData]);

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
          <button className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            className="border-border bg-muted text-foreground block w-full rounded-lg border py-2 pr-3 pl-10 placeholder-placeholder transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari keterangan aktivitas atau user..."
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex-none">
            <div className="flex items-center gap-2">
              <Filter className="text-faint-foreground h-4 w-4" />
              <span>Semua User</span>
            </div>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:flex-none">
            <span>Semua Modul</span>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto">
            <div className="flex items-center gap-2">
              <Calendar className="text-faint-foreground h-4 w-4" />
              <span>Hari Ini</span>
            </div>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Dense Layout */}
      <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/80">
              <tr>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Waktu
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  User & Role
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Modul
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Aksi
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Keterangan Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft bg-card divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-6 py-12 text-center text-sm">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let actionColor = "text-muted-foreground bg-muted";
                  if (log.action === "CREATE") actionColor = "text-emerald-700 bg-emerald-50";
                  if (log.action === "UPDATE") actionColor = "text-blue-700 bg-blue-50";
                  if (log.action === "DELETE") actionColor = "text-rose-700 bg-rose-50";
                  if (log.action === "LOGIN") actionColor = "text-purple-700 bg-purple-50";

                  return (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="text-muted-foreground px-6 py-2.5 font-mono text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="text-foreground px-6 py-2.5 text-xs font-semibold whitespace-nowrap">
                        {log.public_users?.full_name || "System / Deleted User"}
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5 text-xs font-medium whitespace-nowrap">
                        {log.module}
                      </td>
                      <td className="px-6 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${actionColor}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td
                        className="text-muted-foreground max-w-md truncate px-6 py-2.5 font-mono text-xs tracking-tight"
                        title={log.description ?? undefined}
                      >
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              Menampilkan <span className="text-foreground font-semibold">{startFrom}</span> -{" "}
              <span className="text-foreground font-semibold">{endTo}</span> dari{" "}
              <span className="text-foreground font-semibold">{pagination.total}</span> catatan
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                Tampil per hal:
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                disabled={isLoading}
                className="border-border bg-card text-foreground rounded-md border px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="border-border text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <span className="text-foreground px-3 text-sm font-medium">
              Hal {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="border-border text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
