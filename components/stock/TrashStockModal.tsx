"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Trash2,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  User,
  Clock,
  ArrowDownLeft,
  Package,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getTrashedPurchases, TrashedStockItem } from "@/actions/purchases";

interface TrashStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashStockModal({ isOpen, onClose }: TrashStockModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: trashedItems = [],
    error,
    isLoading,
    mutate,
  } = useSWR<TrashedStockItem[]>(isOpen ? "trashed-stocks" : null, async () => {
    const res = await getTrashedPurchases();
    if (res.error) throw new Error(res.error);
    return res.data || [];
  });

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return trashedItems;
    const q = searchQuery.toLowerCase();
    return trashedItems.filter(
      (item) =>
        (item.sku || "").toLowerCase().includes(q) ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.deleted_by_name || "").toLowerCase().includes(q),
    );
  }, [trashedItems, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-border flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
      >
        {/* Modal Header */}
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">Tong Sampah Stok</h2>
              <p className="text-muted-foreground text-xs">
                Daftar stok yang telah dihapus dari etalase, lengkap dengan status asal dan rekam
                jejak kas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              title="Refresh data"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="border-border bg-card flex items-center justify-between border-b px-6 py-3">
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, nama akun, game, atau admin..."
              className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:bg-background w-full rounded-xl border py-1.5 pr-4 pl-9 text-xs outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-muted-foreground text-xs font-medium">
            Total Dihapus: <span className="text-foreground font-bold">{trashedItems.length}</span>{" "}
            unit
          </div>
        </div>

        {/* Modal Body / Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-3 text-xs">
                Memuat riwayat stok yang dihapus...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-rose-500">
              <AlertCircle className="h-8 w-8" />
              <p className="mt-2 text-sm font-semibold">Gagal memuat data</p>
              <p className="text-muted-foreground mt-1 text-xs">{(error as Error).message}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-2xl">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-foreground mt-3 text-sm font-semibold">
                {searchQuery ? "Tidak ditemukan data yang cocok" : "Tong Sampah Kosong"}
              </p>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                {searchQuery
                  ? "Coba kata kunci pencarian yang lain."
                  : "Belum ada riwayat stok yang dihapus dari sistem."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="divide-border min-w-full divide-y text-left">
                <thead className="bg-muted/50 text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  <tr>
                    <th className="px-6 py-3">SKU & Kategori</th>
                    <th className="px-6 py-3">Nama Akun</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Modal Pembelian</th>
                    <th className="px-6 py-3">Jurnal Balik (Refund)</th>
                    <th className="px-6 py-3">Dihapus Oleh</th>
                    <th className="px-6 py-3">Waktu Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y text-xs">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      {/* SKU & Category */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-foreground font-mono text-xs font-bold">
                            {item.sku || "Tanpa SKU"}
                          </span>
                          <span className="text-muted-foreground text-[10px] font-medium">
                            {item.category || "General"}
                          </span>
                        </div>
                      </td>

                      {/* Name & Details */}
                      <td className="px-6 py-3.5">
                        <div className="max-w-xs">
                          <div className="text-foreground truncate font-semibold">{item.name}</div>
                          {item.account_details && (
                            <div className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                              {item.account_details}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Asal */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {item.status === "SOLD" ? (
                          <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            Terjual
                          </span>
                        ) : item.status === "BOOKED" ? (
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                            Dipesan
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      {/* Capital Price */}
                      <td className="text-foreground px-6 py-3.5 font-medium whitespace-nowrap">
                        {formatRupiah(Number(item.capital_price) || 0)}
                      </td>

                      {/* Refund / Jurnal Balik */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {item.refund_amount ? (
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                            <span>+{formatRupiah(Number(item.refund_amount))}</span>
                            {item.refund_account_name && (
                              <span className="text-muted-foreground text-[10px] font-normal">
                                ({item.refund_account_name})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            {item.status === "SOLD" ? "- (Sudah Terjual)" : "Tidak ada refund"}
                          </span>
                        )}
                      </td>

                      {/* Deleted By */}
                      <td className="text-muted-foreground px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="text-muted-foreground h-3.5 w-3.5" />
                          <span className="text-foreground font-medium">
                            {item.deleted_by_name || "Sistem / Admin"}
                          </span>
                        </div>
                      </td>

                      {/* Deleted At */}
                      <td className="text-muted-foreground px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="text-muted-foreground h-3.5 w-3.5" />
                          <span>{item.deleted_at ? formatDate(item.deleted_at) : "-"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-border bg-muted/20 text-muted-foreground flex items-center justify-between border-t px-6 py-3 text-xs">
          <span>
            ℹ️ Data di tong sampah diarsipkan untuk menjaga integritas riwayat transaksi dan buku
            kas.
          </span>
          <button
            onClick={onClose}
            className="border-border bg-card text-foreground hover:bg-muted rounded-xl border px-4 py-1.5 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
