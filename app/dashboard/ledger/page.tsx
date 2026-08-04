"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  PenTool,
  Loader2,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getLedgers } from "@/app/actions/ledger";
import { LedgerWithRelations } from "@/types/database";

type LedgerRecord = LedgerWithRelations;

export default function LedgerPage() {
  const [ledgers, setLedgers] = useState<LedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadLedgers = async () => {
    try {
      setIsLoading(true);
      const data = await getLedgers();
      setLedgers((data as unknown as LedgerRecord[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLedgers();
  }, []);

  const filteredLedgers = ledgers.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ref_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const record = item as unknown as Record<string, unknown>;
    const matchesType =
      typeFilter === "ALL" || record.type === typeFilter || record.transaction_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buku Kas / Ledger</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Catatan riwayat seluruh pergerakan uang masuk, keluar, dan mutasi internal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900">
            <FileText className="h-4 w-4" />
            Export Excel
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-10 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari referensi, catatan, atau ID..."
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Semua Tipe Kas</option>
              <option value="IN">Uang Masuk (IN)</option>
              <option value="OUT">Uang Keluar (OUT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Tanggal & ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Tipe Transaksi
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Rekening
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Referensi / Catatan
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Nominal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Tidak ada riwayat mutasi yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((tx) => {
                  const isPositive = Number(tx.amount) >= 0;

                  // Determine Badge styling based on transaction type
                  let typeBadge = "";
                  let IconType = ArrowUpRight;
                  if ((tx.transaction_type as string) === "Pembayaran Masuk") {
                    typeBadge = "bg-emerald-50 text-emerald-600 border-emerald-100";
                    IconType = ArrowUpRight;
                  } else if ((tx.transaction_type as string) === "Mutasi Masuk") {
                    typeBadge = "bg-blue-50 text-blue-600 border-blue-100";
                    IconType = ArrowRightLeft;
                  } else if ((tx.transaction_type as string) === "Mutasi Keluar") {
                    typeBadge = "bg-rose-50 text-rose-600 border-rose-100";
                    IconType = ArrowDownRight;
                  } else if (
                    (tx.transaction_type as string) === "Penyesuaian" ||
                    (tx.transaction_type as string) === "Refund" ||
                    (tx.transaction_type as string) === "Pengeluaran Operasional" ||
                    (tx.transaction_type as string) === "Pembayaran Pembelian Stok"
                  ) {
                    typeBadge = "bg-amber-50 text-amber-600 border-amber-100";
                    IconType = PenTool;
                  }

                  return (
                    <tr key={tx.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-500">
                        <div className="flex flex-col">
                          <span className="mb-0.5 text-[11px] font-medium text-slate-400">
                            {formatDate(tx.created_at)}
                          </span>
                          <span
                            className="w-24 truncate font-semibold text-slate-900"
                            title={tx.id}
                          >
                            {tx.id.split("-")[0]}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${typeBadge}`}
                        >
                          <IconType className="h-3 w-3" />
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-slate-600">
                        {tx.accounts?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex max-w-[250px] flex-col">
                          <span className="truncate font-semibold text-slate-900">
                            Ref: {tx.ref_id || "-"}
                          </span>
                          <span className="mt-0.5 truncate text-xs text-slate-500">
                            {tx.notes || "-"}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 text-right text-sm font-bold tracking-tight whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-slate-900"}`}
                      >
                        {isPositive ? "+" : ""}
                        {formatRupiah(Number(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <button className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Mockup */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <div className="text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-900">{ledgers.length > 0 ? 1 : 0}</span> -{" "}
            <span className="font-semibold text-slate-900">{ledgers.length}</span> dari{" "}
            <span className="font-semibold text-slate-900">{ledgers.length}</span> mutasi
          </div>
          <div className="flex gap-1">
            <button className="cursor-not-allowed rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-400">
              Sebelummnya
            </button>
            <button className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
