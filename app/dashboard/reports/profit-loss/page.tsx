"use client";

import React from "react";
import { Download, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterDropdown, type FilterDropdownOption } from "@/components/ui/FilterDropdown";
import {
  useProfitLossReport,
  getMonthOptions,
} from "@/lib/hooks/features/useProfitLossReport";

export default function ProfitLossPage() {
  const {
    data: { reportData, grossProfit, totalExpenses },
    isLoading,
    uiState: { periodFilter },
    actions: { setPeriodFilter },
  } = useProfitLossReport();

  const monthOptions = getMonthOptions(12);
  const periodOptions: FilterDropdownOption[] = [
    { value: "THIS_MONTH", label: "Bulan Ini" },
    { value: "LAST_MONTH", label: "Bulan Lalu" },
    { value: "THIS_YEAR", label: "Tahun Ini" },
    ...monthOptions,
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex animate-pulse justify-between gap-4">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-48 rounded"></div>
            <div className="bg-muted h-4 w-72 rounded"></div>
          </div>
          <div className="bg-muted h-10 w-32 rounded"></div>
        </div>
        {/* 3 Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border-soft bg-card flex h-24 animate-pulse items-center gap-4 rounded-xl border px-6 py-5 shadow-sm"
            >
              <div className="bg-muted h-12 w-12 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-3 w-20 rounded"></div>
                <div className="bg-muted h-6 w-32 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Big Table Card */}
        <div className="border-border bg-card flex animate-pulse flex-col rounded-xl border shadow-sm">
          <div className="border-border space-y-2 border-b px-6 py-5">
            <div className="bg-muted h-5 w-48 rounded"></div>
            <div className="bg-muted h-3 w-72 rounded"></div>
          </div>
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-border-soft flex justify-between border-b py-2">
                <div className="bg-muted h-4 w-32 rounded"></div>
                <div className="bg-muted h-4 w-16 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Gagal memuat laporan laba rugi.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Laba Rugi (Profit & Loss)"
        subtitle="Analisis pendapatan, beban pokok penjualan, dan laba bersih bisnis."
        actions={
          <button className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all">
            <Download className="h-4 w-4" />
            Eksport Laporan
          </button>
        }
      />

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <p className="text-muted-foreground text-sm font-medium">
          Menampilkan laporan laba rugi periode terpilih.
        </p>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <FilterDropdown
            value={periodFilter}
            onSelect={setPeriodFilter}
            ariaLabel="Filter periode laporan"
            options={periodOptions}
            menuClassName="max-h-80 overflow-y-auto"
          />
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* TOTAL INCOME */}
        <div className="border-border-soft bg-card flex items-center gap-4 rounded-xl border px-6 py-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Total Pendapatan (Omzet)
            </span>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(reportData.revenue ?? 0)}
            </h3>
          </div>
        </div>

        {/* HPP (COGS) */}
        <div className="border-border-soft bg-card flex items-center gap-4 rounded-xl border px-6 py-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Beban Pokok Penjualan (HPP)
            </span>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(reportData.cogs ?? 0)}
            </h3>
          </div>
        </div>

        {/* LABA KOTOR */}
        <div className="border-border-soft bg-card flex items-center gap-4 rounded-xl border px-6 py-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Total Laba Kotor
            </span>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(grossProfit)}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. REPORT DETAIL STATEMENT */}
      <div className="border-border bg-card flex flex-col rounded-xl border shadow-sm">
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-foreground text-base font-bold">
              Laporan Laba Rugi Struktur Standar
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Sajian rincian pendapatan operasional dan beban komersial periode terpilih.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* PENDAPATAN */}
            <div>
              <h3 className="text-foreground border-b pb-2 text-sm font-bold">Pendapatan</h3>
              <div className="divide-y text-sm">
                {reportData.breakdown?.income?.map((rev, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground font-medium">{rev.label}</span>
                    <span className="text-foreground font-semibold">
                      {formatRupiah(rev.amount)}
                    </span>
                  </div>
                ))}
                {(!reportData.breakdown?.income || reportData.breakdown.income.length === 0) && (
                  <div className="py-3 text-center text-xs font-medium text-blue-500">
                    Tidak ada pendapatan operasional tercatat.
                  </div>
                )}
                <div className="flex items-center justify-between py-3 text-sm font-bold">
                  <span className="text-foreground">Total Pendapatan</span>
                  <span className="text-foreground">{formatRupiah(reportData.revenue ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* HARGA POKOK PENJUALAN */}
            <div>
              <h3 className="text-foreground border-b pb-2 text-sm font-bold">
                Harga Pokok Penjualan (HPP)
              </h3>
              <div className="divide-y text-sm">
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground font-medium">
                    Beban Pokok Penjualan HPP
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

            {/* LABA KOTOR STATS */}
            <div className="bg-muted/30 flex items-center justify-between rounded-lg border-t border-b px-3 py-3 text-sm font-bold">
              <span className="text-foreground">TOTAL LABA KOTOR</span>
              <span className="text-foreground">{formatRupiah(grossProfit)}</span>
            </div>

            {/* BIAYA OPERASIONAL */}
            <div>
              <h3 className="text-foreground border-b pb-2 text-sm font-bold">Beban Operasional</h3>
              <div className="divide-y text-sm">
                {reportData.breakdown?.expenses?.map((exp, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground font-medium">{exp.label}</span>
                    <span className="text-foreground font-semibold">
                      {formatRupiah(exp.amount)}
                    </span>
                  </div>
                ))}
                {(!reportData.breakdown?.expenses ||
                  reportData.breakdown.expenses.length === 0) && (
                  <div className="py-3 text-center text-xs font-medium text-blue-500">
                    Tidak ada pengeluaran operasional tercatat.
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
    </>
  );
}
