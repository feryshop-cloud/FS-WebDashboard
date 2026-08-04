"use client";

import React, { useState, useEffect } from "react";
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
import { getProfitLossReport } from "@/app/actions/reports";

interface ProfitLossBreakdownItem {
  label: string;
  amount: number;
}

interface ProfitLossReportData {
  revenue?: number;
  cogs?: number;
  netProfit?: number;
  breakdown?: {
    income?: ProfitLossBreakdownItem[];
    expenses?: ProfitLossBreakdownItem[];
  };
  // Legacy fields (kept for backward compat)
  totalRevenue?: number;
  totalHPP?: number;
  grossProfit?: number;
  totalOperationalExpenses?: number;
  grossProfitMargin?: number;
  netProfitMargin?: number;
  revenueItems?: Array<{ name: string; amount: number }>;
  hppItems?: Array<{ name: string; amount: number }>;
  expenseItems?: Array<{ name: string; amount: number }>;
}

export default function ProfitLossPage() {
  const [reportData, setReportData] = useState<ProfitLossReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("ALL");

  const getDateRange = (filter: string) => {
    const now = new Date();
    if (filter === "TODAY") {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      return { startDate: start, endDate: end };
    }
    if (filter === "7_DAYS") {
      const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
      return { startDate: start, endDate: undefined };
    }
    if (filter === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { startDate: start, endDate: undefined };
    }
    if (filter === "THIS_YEAR") {
      const start = new Date(now.getFullYear(), 0, 1).toISOString();
      return { startDate: start, endDate: undefined };
    }
    return { startDate: undefined, endDate: undefined };
  };

  useEffect(() => {
    let isMounted = true;
    const { startDate, endDate } = getDateRange(periodFilter);
    getProfitLossReport(startDate, endDate).then((data) => {
      if (isMounted) {
        setReportData(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [periodFilter]);

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
        <p className="text-slate-500">Gagal memuat laporan laba rugi.</p>
      </div>
    );
  }

  const grossProfit = (reportData.revenue ?? 0) - (reportData.cogs ?? 0);
  const totalExpenses = (reportData.breakdown?.expenses ?? [])
    .slice(1)
    .reduce((acc: number, curr: ProfitLossBreakdownItem) => acc + curr.amount, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laba Rugi (Profit & Loss)
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Analisis pendapatan, beban pokok penjualan, dan laba bersih bisnis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm sm:w-auto">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="cursor-pointer bg-transparent pr-4 font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7_DAYS">7 Hari Terakhir</option>
              <option value="THIS_MONTH">Bulan Ini</option>
              <option value="THIS_YEAR">Tahun Ini</option>
            </select>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
              Total Pendapatan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-800">
              {formatRupiah(reportData.revenue ?? 0)}
            </h3>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
              Total HPP / Modal Stok
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-800">
              {formatRupiah(reportData.cogs ?? 0)}
            </h3>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-b-4 border-slate-100 border-b-blue-500 bg-white px-6 py-5 shadow-sm">
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
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">Rincian Laba Rugi</h2>
        </div>

        <div className="p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* PENDAPATAN */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 uppercase">
                <ArrowUpRight className="h-4 w-4" /> Pendapatan (Revenue)
              </h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50">
                {(reportData.breakdown?.income ?? []).map(
                  (item: ProfitLossBreakdownItem, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ),
                )}
                <div className="flex items-center justify-between rounded-b-lg border-t-2 border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Total Pendapatan</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatRupiah(reportData.revenue ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* HPP */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-rose-600 uppercase">
                <ArrowDownRight className="h-4 w-4" /> Harga Pokok Penjualan (HPP)
              </h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">
                    {reportData.breakdown?.expenses?.[0]?.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    ({formatRupiah(reportData.breakdown?.expenses?.[0]?.amount ?? 0)})
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-b-lg border-t-2 border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Total HPP</span>
                  <span className="text-sm font-bold text-rose-600">
                    ({formatRupiah(reportData.cogs ?? 0)})
                  </span>
                </div>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-4">
              <span className="text-base font-bold text-slate-800">Laba Kotor (Gross Profit)</span>
              <span className="text-lg font-bold text-blue-700">{formatRupiah(grossProfit)}</span>
            </div>

            {/* BEBAN OPERASIONAL */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-orange-600 uppercase">
                <ArrowDownRight className="h-4 w-4" /> Beban Operasional & Lainnya
              </h3>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50">
                {(reportData.breakdown?.expenses ?? [])
                  .slice(1)
                  .map((item: ProfitLossBreakdownItem, idx: number) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        ({formatRupiah(item.amount)})
                      </span>
                    </div>
                  ))}
                <div className="flex items-center justify-between rounded-b-lg border-t-2 border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Total Beban</span>
                  <span className="text-sm font-bold text-orange-600">
                    ({formatRupiah(totalExpenses)})
                  </span>
                </div>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-6 py-5 shadow-md">
              <span className="text-lg font-bold tracking-wide text-white">
                Laba Bersih (Net Profit)
              </span>
              <span className="text-2xl font-bold tracking-tight text-emerald-400">
                {formatRupiah(reportData.netProfit ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
