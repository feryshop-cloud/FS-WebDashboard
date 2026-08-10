"use client";

import React from "react";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useProfitLossReport } from "@/lib/hooks/features/useProfitLossReport";

export default function ProfitLossPage() {
  const {
    data: { reportData, grossProfit, totalExpenses },
    isLoading,
    uiState: { periodFilter },
    actions: { setPeriodFilter },
  } = useProfitLossReport();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
        <p className="text-muted-foreground">Gagal memuat laporan laba rugi.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Laba Rugi (Profit & Loss)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Analisis pendapatan, beban pokok penjualan, dan laba bersih bisnis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-border bg-card text-foreground relative inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium shadow-sm sm:w-auto">
            <Calendar className="text-faint-foreground mr-2 h-4 w-4" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-foreground cursor-pointer bg-transparent pr-4 font-medium outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7_DAYS">7 Hari Terakhir</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="THIS_YEAR">Tahun Ini</option>
            </select>
          </div>
          <button className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Pendapatan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-foreground text-3xl font-bold tracking-tight">
              {formatRupiah(reportData.revenue ?? 0)}
            </h3>
          </div>
        </div>

        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total HPP / Modal Stok
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-foreground text-3xl font-bold tracking-tight">
              {formatRupiah(reportData.cogs ?? 0)}
            </h3>
          </div>
        </div>

        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border border-b-4 border-b-blue-500 px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-blue-600 uppercase">
              Laba Bersih
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-blue-700">
              {formatRupiah(reportData.netProfit ?? 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Structured P&L Table */}
      <div className="border-border-soft bg-card mt-2 overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border-soft bg-muted/50 border-b px-6 py-4">
          <h2 className="text-foreground text-base font-bold">Rincian Laba Rugi</h2>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* PENDAPATAN */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 uppercase">
                <ArrowUpRight className="h-4 w-4" /> Pendapatan (Revenue)
              </h3>
              <div className="divide-border-soft border-border-soft divide-y rounded-xl border px-5 py-2">
                {(reportData.breakdown?.income || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="text-foreground font-semibold">
                      {formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3 text-sm font-bold">
                  <span className="text-foreground">Total Pendapatan Bersih</span>
                  <span className="text-emerald-600">{formatRupiah(reportData.revenue ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* HARGA POKOK PENJUALAN */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-rose-600 uppercase">
                <ArrowDownRight className="h-4 w-4" /> Harga Pokok Penjualan (COGS)
              </h3>
              <div className="divide-border-soft border-border-soft divide-y rounded-xl border px-5 py-2">
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-muted-foreground font-medium">
                    Beban Pokok Penjualan (HPP)
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatRupiah(reportData.cogs ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 text-sm font-bold">
                  <span className="text-foreground">Total Harga Pokok Penjualan</span>
                  <span className="text-rose-600">({formatRupiah(reportData.cogs ?? 0)})</span>
                </div>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="bg-muted/50 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-foreground">LABA KOTOR (Gross Profit)</span>
                <span className="text-foreground">{formatRupiah(grossProfit)}</span>
              </div>
            </div>

            {/* BEBAN OPERASIONAL */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-rose-600 uppercase">
                <ArrowDownRight className="h-4 w-4" /> Beban Operasional & Lainnya
              </h3>
              <div className="divide-border-soft border-border-soft divide-y rounded-xl border px-5 py-2">
                {(reportData.breakdown?.expenses || []).slice(1).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="text-foreground font-semibold">
                      {formatRupiah(item.amount)}
                    </span>
                  </div>
                ))}
                {(!reportData.breakdown?.expenses || reportData.breakdown.expenses.length <= 1) && (
                  <div className="py-3 text-center text-xs font-medium text-blue-500">
                    Tidak ada pengeluaran operasional lain.
                  </div>
                )}
                <div className="flex items-center justify-between py-3 text-sm font-bold">
                  <span className="text-foreground">Total Beban Operasional</span>
                  <span className="text-rose-600">({formatRupiah(totalExpenses)})</span>
                </div>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className="border-t-2 border-dashed pt-4">
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-6 py-5 text-sm font-bold">
                <span className="text-base text-blue-900">LABA BERSIH (Net Profit)</span>
                <span className="text-lg text-blue-700">
                  {formatRupiah(reportData.netProfit ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
