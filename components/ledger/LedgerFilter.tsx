"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Account } from "@/types/database";
// No sonner import

interface LedgerFilterProps {
  accounts: Account[];
}

import { ChevronDown, Download, Calendar, Search, Loader2 } from "lucide-react";

export function LedgerFilter({ accounts }: LedgerFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const currentAccountId = searchParams.get("accountId") || "";
  const currentType = searchParams.get("type") || "";

  function handleFilterChange(key: "accountId" | "type", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/ledger?${params.toString()}`);
  }

  async function handleExportExcel() {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (currentAccountId) params.set("accountId", currentAccountId);
      if (currentType) params.set("type", currentType);
      const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
      const basePath =
        routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";

      const response = await fetch(`${basePath}/api/export/ledger?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Gunakan regex untuk extract filename dari content-disposition jika ada,
      // tapi untuk amannya kita define hardcode nama file sebagai fallback.
      link.setAttribute(
        "download",
        `Laporan_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Berhasil mengekspor Laporan Ledger");
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Gagal mengunduh Excel";
      alert(message);
    } finally {
      setIsExporting(false);
    }
  }

  const selectClass =
    "w-full xl:w-[180px] shrink-0 border border-slate-200 rounded-md bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer";
  const buttonClass =
    "flex items-center gap-2 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="mb-6 w-full rounded-md border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex w-full flex-col items-center justify-between gap-4 xl:flex-row">
        {/* Left Side (Dropdowns) */}
        <div className="flex w-full items-center gap-3 xl:w-auto">
          <div className="relative w-full xl:w-auto">
            <select
              value={currentAccountId}
              onChange={(e) => handleFilterChange("accountId", e.target.value)}
              className={`${selectClass} h-10`}
            >
              <option value="">Semua Rekening</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative w-full xl:w-auto">
            <select
              value={currentType}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className={`${selectClass} h-10`}
            >
              <option value="">Semua Status</option>
              <option value="IN">Uang Masuk (IN)</option>
              <option value="OUT">Uang Keluar (OUT)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {(currentAccountId || currentType) && (
            <button
              onClick={() => router.push("/dashboard/ledger")}
              className="flex h-10 items-center px-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Right Side (Range & Export Buttons) */}
        <div className="flex w-full items-center justify-start gap-3 xl:w-auto xl:justify-end">
          <div className="relative w-full xl:w-[220px]">
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="h-10 w-full rounded-md border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <button className={`${buttonClass} h-10 shrink-0 whitespace-nowrap`}>
            <Calendar className="h-4 w-4 text-slate-500" />
            Range filter
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className={`${buttonClass} h-10 shrink-0 whitespace-nowrap`}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <Download className="h-4 w-4 text-emerald-600" />
            )}
            {isExporting ? "Mengekspor..." : "Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
