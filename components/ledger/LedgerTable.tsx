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

  const getAccountIcon = (
    account: { image_url?: string | null; name?: string | null } | null | undefined,
  ) => {
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
      <div className="bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full shadow-sm">
        <Wallet className="h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <div className="border-border bg-card w-full overflow-x-auto rounded-xl border">
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
        <tbody className="divide-border-soft divide-y">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-muted-foreground px-4 py-12 text-center text-sm">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-faint-foreground mb-2 text-2xl">📊</span>
                  <span className="text-foreground font-semibold">Belum ada catatan transaksi</span>
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
                    className={`group hover:bg-muted/50 cursor-pointer transition-colors ${expandedRowId === entry.id ? "bg-muted/50" : ""}`}
                  >
                    <td className="text-muted-foreground truncate px-3 py-2 text-center text-[13px]">
                      {index + 1}
                    </td>
                    <td
                      className="text-muted-foreground truncate px-3 py-2 text-[13px]"
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
                    <td className="text-foreground truncate px-3 py-2 text-[13px] font-semibold tracking-tight">
                      {isPositive ? "+" : ""} {formatRupiah(Number(entry.amount))}
                    </td>
                    <td
                      className="text-muted-foreground truncate px-3 py-2 text-[13px]"
                      title={entry.description || ""}
                    >
                      {entry.description || "-"}
                    </td>
                    <td className="truncate px-3 py-2">
                      <div
                        className="flex flex-row items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-md border transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="border-border text-muted-foreground flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRowId === entry.id && (
                    <tr className="border-border-soft/50 bg-muted/50 border-b">
                      <td colSpan={7} className="px-4 py-4 whitespace-normal">
                        <div className="border-border bg-card text-foreground rounded-lg border p-4 text-[13px] shadow-sm">
                          <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
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
