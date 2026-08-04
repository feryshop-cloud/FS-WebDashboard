"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Calendar, ChevronDown, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getAuditLogs } from "@/app/actions/audit-log";
import { AuditLog } from "@/types/database";

type AuditLogWithUser = AuditLog & { public_users?: { full_name?: string | null } | null };

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const logsData = await getAuditLogs();
    setLogs((logsData as unknown as AuditLogWithUser[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Log</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Catatan aktivitas admin, perubahan data, dan akses sistem (Read-only).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-10 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari keterangan aktivitas atau user..."
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button className="inline-flex flex-1 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-none">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Semua User</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex flex-1 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-none">
            <span>Semua Modul</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Hari Ini</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Table Dense Layout */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Waktu
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  User & Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Modul
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Aksi
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Keterangan Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let actionColor = "text-slate-600 bg-slate-100";
                  if (log.action === "CREATE") actionColor = "text-emerald-700 bg-emerald-50";
                  if (log.action === "UPDATE") actionColor = "text-blue-700 bg-blue-50";
                  if (log.action === "DELETE") actionColor = "text-rose-700 bg-rose-50";
                  if (log.action === "LOGIN") actionColor = "text-purple-700 bg-purple-50";

                  return (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-2.5 font-mono text-xs whitespace-nowrap text-slate-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-800">
                        {log.public_users?.full_name || "System / Deleted User"}
                      </td>
                      <td className="px-6 py-2.5 text-xs font-medium whitespace-nowrap text-slate-600">
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
                        className="max-w-md truncate px-6 py-2.5 font-mono text-xs tracking-tight text-slate-600"
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
      </div>
    </div>
  );
}
