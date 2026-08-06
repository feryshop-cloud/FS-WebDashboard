"use client";

import React, { useState, useEffect } from "react";
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
import { getErrorMessage } from "@/lib/error";
import { getLedgerEntries } from "@/actions/ledger";

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

import { LedgerWithRelations } from "@/types/database";

const YEARS = [2025, 2026, 2027];

export default function CashflowPage() {
  const [entries, setEntries] = useState<LedgerWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getLedgerEntries();
      if (res.error) {
        setError(res.error);
      } else {
        setEntries(res.data || []);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Gagal memuat data arus kas."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  // Filter entries for the selected month and year
  const monthlyEntries = entries.filter((entry) => {
    const d = new Date(entry.created_at);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Filter entries for the table based on search
  const filteredEntries = monthlyEntries.filter((entry) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      (entry.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.account?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.transaction_type || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Aggregation
  let cashIn = 0;
  let cashOut = 0;

  let totalPaymentIn = 0;
  let totalTransferIn = 0;
  let totalRefundIn = 0;
  let totalCashbackIn = 0;
  let totalAdjustmentIn = 0;
  let totalOtherIn = 0;

  let totalStockPurchase = 0;
  let totalPaymentOut = 0;
  let totalRefundOut = 0;
  let totalCashbackOut = 0;
  let totalTransferOut = 0;
  let totalAdjustmentOut = 0;
  let totalOtherOut = 0;

  monthlyEntries.forEach((entry) => {
    const amt = Number(entry.amount);
    if (amt > 0) {
      cashIn += amt;
      switch (entry.transaction_type) {
        case "PAYMENT_IN":
          // Distinguish DP / Cicilan vs Lunas via description keywords
          const desc = (entry.description || "").toLowerCase();
          if (desc.includes("dp") || desc.includes("cicilan") || desc.includes("down payment")) {
            totalCashbackIn += amt; // Put in a different bucket temporarily or group
          } else {
            totalPaymentIn += amt;
          }
          break;
        case "TRANSFER_IN":
          totalTransferIn += amt;
          break;
        case "REFUND":
          totalRefundIn += amt;
          break;
        case "CASHBACK":
          totalCashbackIn += amt;
          break;
        case "ADJUSTMENT":
          totalAdjustmentIn += amt;
          break;
        default:
          totalOtherIn += amt;
          break;
      }
    } else if (amt < 0) {
      const absAmt = Math.abs(amt);
      cashOut += absAmt;
      switch (entry.transaction_type) {
        case "STOCK_PURCHASE":
          totalStockPurchase += absAmt;
          break;
        case "PAYMENT_OUT":
          totalPaymentOut += absAmt;
          break;
        case "REFUND":
          totalRefundOut += absAmt;
          break;
        case "CASHBACK":
          totalCashbackOut += absAmt;
          break;
        case "TRANSFER_OUT":
          totalTransferOut += absAmt;
          break;
        case "ADJUSTMENT":
          totalAdjustmentOut += absAmt;
          break;
        default:
          totalOtherOut += absAmt;
          break;
      }
    }
  });

  const netCashflow = cashIn - cashOut;

  // Split PAYMENT_IN breakdown nicely
  const inflows = [
    { label: "Penerimaan Penjualan (Lunas)", amount: totalPaymentIn },
    { label: "Penerimaan DP / Cicilan", amount: totalCashbackIn }, // using grouped cashback/inflows
    { label: "Transfer Masuk / Mutasi", amount: totalTransferIn },
    { label: "Penerimaan Refund / Batal", amount: totalRefundIn },
    { label: "Penyesuaian Saldo Masuk", amount: totalAdjustmentIn },
    { label: "Penerimaan Lainnya", amount: totalOtherIn },
  ].filter((item) => item.amount > 0);

  const outflows = [
    { label: "Pembayaran Pembelian Stok", amount: totalStockPurchase },
    { label: "Pengeluaran Operasional / Umum", amount: totalPaymentOut },
    { label: "Pengeluaran Refund / Batal", amount: totalRefundOut },
    { label: "Pengeluaran Cashback", amount: totalCashbackOut },
    { label: "Transfer Keluar / Mutasi", amount: totalTransferOut },
    { label: "Penyesuaian Saldo Keluar", amount: totalAdjustmentOut },
    { label: "Pengeluaran Lainnya", amount: totalOtherOut },
  ].filter((item) => item.amount > 0);

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;

    const headers = ["Tanggal", "Rekening", "Tipe Transaksi", "Keterangan", "Jumlah (IDR)"];
    const rows = filteredEntries.map((entry) => [
      new Date(entry.created_at).toLocaleString("id-ID"),
      entry.account?.name || "-",
      entry.transaction_type,
      entry.description || "-",
      entry.amount,
    ]);

    // Use BOM for Excel compatibility in UTF-8
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `arus-kas-${MONTHS[selectedMonth]}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Arus Kas (Cash Flow)</h1>
          <p className="mt-0.5 text-sm text-slate-500">
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
              className="inline-flex min-w-[140px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span>{MONTHS[selectedMonth]}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {isMonthDropdownOpen && (
              <div className="absolute top-full right-0 z-20 mt-1.5 max-h-60 w-44 overflow-y-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(idx);
                      setIsMonthDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 ${selectedMonth === idx ? "bg-blue-50/50 text-blue-600" : "text-blue-700"}`}
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
              className="inline-flex min-w-[90px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {isYearDropdownOpen && (
              <div className="absolute top-full right-0 z-20 mt-1.5 w-28 rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setSelectedYear(y);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 ${selectedYear === y ? "bg-blue-50/50 text-blue-600" : "text-blue-700"}`}
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
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
              Total Kas Masuk
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-emerald-600">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              ) : (
                formatRupiah(cashIn)
              )}
            </h3>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
              Total Kas Keluar
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-rose-600">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              ) : (
                formatRupiah(cashOut)
              )}
            </h3>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-b-4 border-slate-100 border-b-blue-600 bg-white px-6 py-5 shadow-sm transition-shadow hover:shadow-md">
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
              className={`text-3xl font-black tracking-tight ${netCashflow >= 0 ? "text-slate-800" : "text-rose-600"}`}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
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
        <div className="h-fit overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="text-base font-bold text-slate-800">Rincian Arus Kas</h2>
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
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Penerimaan Kas
                  </h3>
                  {inflows.length === 0 ? (
                    <p className="pl-3 text-sm text-slate-400">Tidak ada kas masuk.</p>
                  ) : (
                    <div className="space-y-3 pl-3">
                      {inflows.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-500">{item.label}</span>
                          <span className="font-semibold text-slate-900">
                            {formatRupiah(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                        <span className="text-slate-800">Total Masuk</span>
                        <span className="text-emerald-600">{formatRupiah(cashIn)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* OUTFLOWS */}
                <div>
                  <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Pengeluaran Kas
                  </h3>
                  {outflows.length === 0 ? (
                    <p className="pl-3 text-sm text-slate-400">Tidak ada kas keluar.</p>
                  ) : (
                    <div className="space-y-3 pl-3">
                      {outflows.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-500">{item.label}</span>
                          <span className="font-semibold text-slate-900">
                            ({formatRupiah(item.amount)})
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                        <span className="text-slate-800">Total Keluar</span>
                        <span className="text-rose-600">({formatRupiah(cashOut)})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUMMARY ROW */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 font-bold text-slate-950">
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
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center">
            <h2 className="text-base font-bold text-slate-800">Riwayat Transaksi Kas</h2>
            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-24 text-center text-sm text-slate-400">
                Tidak ada transaksi kas untuk periode ini.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="sticky top-0 bg-slate-50/60">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                      Tanggal
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                      Rekening
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                      Tipe
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                      Keterangan
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-right text-xs font-bold tracking-wider text-slate-500 uppercase"
                    >
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredEntries.map((entry) => {
                    const isPositive = Number(entry.amount) > 0;

                    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
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
                        badgeColor = "bg-slate-50 text-slate-700 border-slate-200";
                        label = "Penyesuaian";
                        break;
                    }

                    return (
                      <tr key={entry.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-slate-500">
                          {new Date(entry.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-slate-700">
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
                          className="max-w-xs truncate px-6 py-4 text-xs font-medium text-slate-600"
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
    </div>
  );
}
