"use client";

import React from "react";
import {
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
  Search,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useCashflowReport } from "@/lib/hooks/features/useCashflowReport";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEARS = [2025, 2026, 2027];

export default function CashflowPage() {
  const {
    data: { filteredEntries, cashIn, cashOut, netCashflow, inflows, outflows },
    isLoading,
    error,
    uiState: { selectedMonth, selectedYear, searchQuery, isMonthDropdownOpen, isYearDropdownOpen },
    actions: {
      setSelectedMonth,
      setSelectedYear,
      setSearchQuery,
      setIsMonthDropdownOpen,
      setIsYearDropdownOpen,
      handleExportCSV,
    },
  } = useCashflowReport();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Arus Kas (Cash Flow)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Laporan pergerakan kas masuk dan keluar aktual (Cash Basis).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setIsMonthDropdownOpen(!isMonthDropdownOpen);
                setIsYearDropdownOpen(false);
              }}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex min-w-35 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm"
            >
              <span>{MONTHS[selectedMonth]}</span>
              <ChevronDown className="text-faint-foreground h-4 w-4" />
            </button>
            {isMonthDropdownOpen && (
              <div className="border-border-soft bg-card absolute top-full right-0 z-20 mt-1.5 max-h-60 w-44 overflow-y-auto rounded-xl border py-1 shadow-lg">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(idx);
                      setIsMonthDropdownOpen(false);
                    }}
                    className={`hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium ${selectedMonth === idx ? "bg-blue-50/50 text-blue-600" : "text-blue-700"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setIsYearDropdownOpen(!isYearDropdownOpen);
                setIsMonthDropdownOpen(false);
              }}
              className="border-border bg-card text-foreground hover:bg-muted inline-flex min-w-22.5 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="text-faint-foreground h-4 w-4" />
            </button>
            {isYearDropdownOpen && (
              <div className="border-border-soft bg-card absolute top-full right-0 z-20 mt-1.5 w-28 rounded-xl border py-1 shadow-lg">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setSelectedYear(y);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`hover:bg-muted w-full px-4 py-2 text-left text-sm font-medium ${selectedYear === y ? "bg-blue-50/50 text-blue-600" : "text-blue-700"}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredEntries.length === 0}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Kas Masuk
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-emerald-600">
              {isLoading ? (
                <Loader2 className="text-faint-foreground h-6 w-6 animate-spin" />
              ) : (
                formatRupiah(cashIn)
              )}
            </h3>
          </div>
        </div>

        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Kas Keluar
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-rose-600">
              {isLoading ? (
                <Loader2 className="text-faint-foreground h-6 w-6 animate-spin" />
              ) : (
                formatRupiah(cashOut)
              )}
            </h3>
          </div>
        </div>

        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border border-b-4 border-b-blue-600 px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-blue-600 uppercase">
              Kenaikan Kas Bersih
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3
              className={`text-3xl font-black tracking-tight ${netCashflow >= 0 ? "text-foreground" : "text-rose-600"}`}
            >
              {isLoading ? (
                <Loader2 className="text-faint-foreground h-6 w-6 animate-spin" />
              ) : (
                formatRupiah(netCashflow)
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* Structured Cashflow Statement & Details */}
      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Breakdown Card */}
        <div className="border-border-soft bg-card h-fit overflow-hidden rounded-xl border shadow-sm lg:col-span-1">
          <div className="border-border-soft bg-muted/50 border-b px-6 py-4">
            <h2 className="text-foreground text-base font-bold">Rincian Arus Kas</h2>
          </div>
          <div className="space-y-6 p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* INFLOWS */}
                <div>
                  <h3 className="text-faint-foreground mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Penerimaan Kas
                  </h3>
                  {inflows.length === 0 ? (
                    <p className="text-faint-foreground pl-3 text-sm">Tidak ada kas masuk.</p>
                  ) : (
                    <div className="space-y-3 pl-3">
                      {inflows.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">{item.label}</span>
                          <span className="text-foreground font-semibold">
                            {formatRupiah(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="border-border-soft flex items-center justify-between border-t pt-2 text-sm font-bold">
                        <span className="text-foreground">Total Masuk</span>
                        <span className="text-emerald-600">{formatRupiah(cashIn)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* OUTFLOWS */}
                <div>
                  <h3 className="text-faint-foreground mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Pengeluaran Kas
                  </h3>
                  {outflows.length === 0 ? (
                    <p className="text-faint-foreground pl-3 text-sm">Tidak ada kas keluar.</p>
                  ) : (
                    <div className="space-y-3 pl-3">
                      {outflows.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">{item.label}</span>
                          <span className="text-foreground font-semibold">
                            ({formatRupiah(item.amount)})
                          </span>
                        </div>
                      ))}
                      <div className="border-border-soft flex items-center justify-between border-t pt-2 text-sm font-bold">
                        <span className="text-foreground">Total Keluar</span>
                        <span className="text-rose-600">({formatRupiah(cashOut)})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUMMARY ROW */}
                <div className="border-border-soft text-foreground flex items-center justify-between border-t pt-4 font-bold">
                  <span className="text-sm">Net Perubahan Kas</span>
                  <span
                    className={`text-base ${netCashflow >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {netCashflow >= 0 ? "+" : ""}
                    {formatRupiah(netCashflow)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="border-border-soft bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm lg:col-span-2">
          <div className="border-border-soft bg-muted/50 flex flex-col justify-between gap-4 border-b px-6 py-4 sm:flex-row sm:items-center">
            <h2 className="text-foreground text-base font-bold">Riwayat Transaksi Kas</h2>
            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="text-faint-foreground h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="border-border bg-card text-foreground placeholder-placeholder w-full rounded-lg border py-1.5 pr-3 pl-9 text-xs font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-faint-foreground py-24 text-center text-sm">
                Tidak ada transaksi kas untuk periode ini.
              </div>
            ) : (
              <table className="divide-border-soft min-w-full divide-y text-sm">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    <th
                      scope="col"
                      className="text-muted-foreground px-6 py-3.5 text-left text-xs font-bold tracking-wider uppercase"
                    >
                      Tanggal
                    </th>
                    <th
                      scope="col"
                      className="text-muted-foreground px-6 py-3.5 text-left text-xs font-bold tracking-wider uppercase"
                    >
                      Rekening
                    </th>
                    <th
                      scope="col"
                      className="text-muted-foreground px-6 py-3.5 text-left text-xs font-bold tracking-wider uppercase"
                    >
                      Tipe
                    </th>
                    <th
                      scope="col"
                      className="text-muted-foreground px-6 py-3.5 text-left text-xs font-bold tracking-wider uppercase"
                    >
                      Keterangan
                    </th>
                    <th
                      scope="col"
                      className="text-muted-foreground px-6 py-3.5 text-right text-xs font-bold tracking-wider uppercase"
                    >
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border-soft bg-card divide-y">
                  {filteredEntries.map((entry) => {
                    const isPositive = Number(entry.amount) > 0;

                    let badgeColor = "bg-muted text-foreground border-border";
                    let label: string = entry.transaction_type as string;

                    switch (entry.transaction_type) {
                      case "PAYMENT_IN":
                        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        label = "Penjualan";
                        break;
                      case "STOCK_PURCHASE":
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                        label = "Beli Stok";
                        break;
                      case "PAYMENT_OUT":
                        badgeColor = "bg-red-50 text-red-700 border-red-100";
                        label = "Pengeluaran";
                        break;
                      case "REFUND":
                        badgeColor = "bg-orange-50 text-orange-700 border-orange-100";
                        label = "Refund";
                        break;
                      case "CASHBACK":
                        badgeColor = "bg-amber-50 text-amber-700 border-amber-100";
                        label = "Cashback";
                        break;
                      case "TRANSFER_IN":
                      case "TRANSFER_OUT":
                        badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                        label = "Mutasi Kas";
                        break;
                      case "ADJUSTMENT":
                        badgeColor = "bg-muted text-foreground border-border";
                        label = "Penyesuaian";
                        break;
                    }

                    return (
                      <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                        <td className="text-muted-foreground px-6 py-4 text-xs font-semibold whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="text-foreground px-6 py-4 text-xs font-semibold whitespace-nowrap">
                          {entry.account?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${badgeColor}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td
                          className="text-muted-foreground max-w-xs truncate px-6 py-4 text-xs font-medium"
                          title={entry.description ?? undefined}
                        >
                          {entry.description || "-"}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-mono text-xs font-bold whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {isPositive ? "+" : ""}
                          {formatRupiah(Number(entry.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
