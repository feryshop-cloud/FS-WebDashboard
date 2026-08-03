"use client";

import { useState, Fragment } from "react";
import { LedgerWithRelations } from "@/types/database";
import { Edit2, Trash2, Wallet } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import Image from "next/image";

interface LedgerTableProps {
  entries: LedgerWithRelations[];
}

export function LedgerTable({ entries }: LedgerTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const formatTxType = (type: string) => {
    switch (type) {
      case "PAYMENT_IN":
        return "Pembayaran Masuk";
      case "PAYMENT_OUT":
        return "Pembayaran Keluar";
      case "REFUND":
        return "Refund";
      case "CASHBACK":
        return "Cashback TT";
      case "TRANSFER_IN":
        return "Mutasi Masuk";
      case "TRANSFER_OUT":
        return "Mutasi Keluar";
      case "STOCK_PURCHASE":
        return "Pembelian Stok";
      case "ADJUSTMENT":
        return "Penyesuaian";
      default:
        return type;
    }
  };

  const getAccountIcon = (account: { image_url?: string | null; name?: string | null } | null | undefined) => {
    if (account?.image_url) {
      return (
        <Image
          src={account.image_url}
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover shadow-sm"
          alt={account.name ?? "account"}
        />
      );
    }

    const name = account?.name?.toLowerCase() || "";
    if (name.includes("dana"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-[12px] font-bold text-white shadow-sm">
          D
        </div>
      );
    if (name.includes("ovo"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-[12px] font-bold text-white shadow-sm">
          O
        </div>
      );
    if (name.includes("gopay"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-[12px] font-bold text-white shadow-sm">
          G
        </div>
      );
    if (name.includes("bca"))
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-[12px] font-bold text-white shadow-sm">
          B
        </div>
      );
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm">
        <Wallet className="h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full table-fixed whitespace-nowrap">
        <thead className="border-b border-blue-700 bg-blue-600">
          <tr>
            <th className="w-12 px-3 py-2 text-center text-[11px] font-semibold tracking-wide text-white uppercase">
              No
            </th>
            <th className="w-32 px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-white uppercase">
              Tanggal
            </th>
            <th className="w-40 px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-white uppercase">
              Tipe Transaksi
            </th>
            <th className="w-16 px-3 py-2 text-center text-[11px] font-semibold tracking-wide text-white uppercase">
              Ref
            </th>
            <th className="w-40 px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-white uppercase">
              Nominal
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold tracking-wide text-white uppercase">
              Catatan
            </th>
            <th className="w-28 px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-white uppercase">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <span className="mb-2 text-2xl text-slate-400">📊</span>
                  <span className="font-semibold text-slate-900">Belum ada catatan transaksi</span>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((entry, index) => {
              const isPositive = Number(entry.amount) > 0;
              const formattedDate = formatDate(entry.created_at);

              return (
                <Fragment key={entry.id}>
                  <tr
                    onClick={() => setExpandedRowId(expandedRowId === entry.id ? null : entry.id)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50/50 ${expandedRowId === entry.id ? "bg-slate-50/50" : ""}`}
                  >
                    <td className="truncate px-3 py-2 text-center text-[13px] text-slate-600">
                      {index + 1}
                    </td>
                    <td
                      className="truncate px-3 py-2 text-[13px] text-slate-600"
                      title={formattedDate}
                    >
                      {formattedDate}
                    </td>
                    <td className="truncate px-3 py-2">
                      <span
                        className={`inline-flex truncate rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}
                        title={formatTxType(entry.transaction_type)}
                      >
                        {formatTxType(entry.transaction_type)}
                      </span>
                    </td>
                    <td className="truncate px-3 py-2">
                      <div className="flex items-center justify-center">
                        {getAccountIcon(entry.account)}
                      </div>
                    </td>
                    <td className="truncate px-3 py-2 text-[13px] font-semibold tracking-tight text-slate-900">
                      {isPositive ? "+" : ""} {formatRupiah(Number(entry.amount))}
                    </td>
                    <td
                      className="truncate px-3 py-2 text-[13px] text-slate-600"
                      title={entry.description || ""}
                    >
                      {entry.description || "-"}
                    </td>
                    <td className="truncate px-3 py-2">
                      <div
                        className="flex flex-row items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRowId === entry.id && (
                    <tr className="border-b border-slate-100/50 bg-slate-50/50">
                      <td colSpan={7} className="px-4 py-4 whitespace-normal">
                        <div className="rounded-lg border border-slate-200 bg-white p-4 text-[13px] text-slate-700 shadow-sm">
                          <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                            Catatan Lengkap
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {entry.description || "Tidak ada catatan untuk transaksi ini."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
