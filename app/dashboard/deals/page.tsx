"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, FileText, ChevronDown, X, Loader2, Trash2 } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getDeals, createPenjualan, deleteDeal } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
import type { Database } from "@/types/database.types";
import { DealWithRelations } from "@/types/database";

type Deal = DealWithRelations;
type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};
type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function DealsPage() {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getDeals(),
        getInventory(),
        getAccounts(),
      ]);
      setDeals((dealsData as unknown as DealWithRelations[]) || []);
      setStocks((stocksResult.data || []).filter((s) => s.status === "AVAILABLE")); // Only available items
      setAccounts(accountsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAddDeal = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createPenjualan(formData);
      setIsAddDealOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      // Bisa tambahkan status filter di sini kalau UI Deals nanti punya state activeFilter
      const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
      const basePath =
        routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";

      const response = await fetch(`${basePath}/api/export/deals?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Laporan_Deals_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Gagal mengunduh Excel";
      alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteDeal = async (id: string, dealNumber: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${dealNumber}"?`)) {
      return;
    }
    try {
      await deleteDeal(id);
      loadData();
    } catch (err: unknown) {
      alert("Gagal menghapus deal: " + getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Transaksi (Deals)
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kelola semua transaksi penjualan reguler, booking, dan cicilan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </button>
          <button
            onClick={() => setIsAddDealOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Deal Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border-soft bg-card p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-faint-foreground" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-border bg-muted py-2 pr-3 pl-10 text-foreground placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari nomor deal, customer, atau stok..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button className="inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-faint-foreground" />
              <span>Semua Status</span>
            </div>
            <ChevronDown className="h-4 w-4 text-faint-foreground" />
          </button>
          <button className="inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:w-auto">
            <span>Pilih Tanggal</span>
            <ChevronDown className="h-4 w-4 text-faint-foreground" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-soft bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Nomor Deal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Stok yang Dijual
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Harga Deal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Total Dibayar
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Status Deal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Tanggal Deal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => {
                  let badgeClass = "bg-muted text-muted-foreground border-border";
                  if (
                    (deal.status as string) === "Lunas" ||
                    (deal.status as string) === "Selesai"
                  ) {
                    badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  } else if (
                    (deal.status as string) === "Booking" ||
                    (deal.status as string) === "Akses Terbatas"
                  ) {
                    badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
                  } else if ((deal.status as string)?.includes("Cancel")) {
                    badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                  }

                  const stockName = deal.deal_items?.[0]?.stocks?.name || "N/A";

                  return (
                    <tr key={deal.id} className="group transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-foreground">
                        {deal.deal_number}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-muted-foreground">
                        {deal.customers?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                        <span className="block max-w-[200px] truncate" title={stockName}>
                          {stockName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-foreground">
                        {formatRupiah(Number(deal.total_deal_price))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold ${Number(deal.total_paid) < Number(deal.total_deal_price) ? "text-orange-600" : "text-emerald-600"}`}
                          >
                            {formatRupiah(Number(deal.total_paid))}
                          </span>
                          {Number(deal.total_paid) < Number(deal.total_deal_price) && (
                            <span className="mt-0.5 text-[10px] font-medium text-faint-foreground">
                              Sisa:{" "}
                              {formatRupiah(
                                Number(deal.total_deal_price) - Number(deal.total_paid),
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}
                        >
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(deal.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteDeal(deal.id, deal.deal_number)}
                          title="Hapus Deal"
                          className="rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <div className="flex items-center justify-between border-t border-border-soft bg-card px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">{deals.length > 0 ? 1 : 0}</span> -{" "}
            <span className="font-semibold text-foreground">{deals.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{deals.length}</span> transaksi
          </div>
          <div className="flex gap-1">
            <button className="cursor-not-allowed rounded-md border border-border px-3 py-1 text-sm text-faint-foreground">
              Sebelummnya
            </button>
            <button className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground hover:bg-muted">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Buat Deal Baru Modal (Slide-over / Modal) */}
      {isAddDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-card shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-border-soft bg-muted px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Buat Deal Baru</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Isi form transaksi penjualan atau booking.
                </p>
              </div>
              <button
                onClick={() => setIsAddDealOpen(false)}
                className="rounded-full bg-card p-2 text-faint-foreground shadow-sm transition-colors hover:text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddDeal} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Pilih Stok
                  </label>
                  <select
                    name="stock_id"
                    required
                    className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Stok Tersedia --</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.title_reference}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Nama Customer
                  </label>
                  <input
                    name="customer_name"
                    required
                    type="text"
                    className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. Budi Santoso"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    No. HP Customer (Opsional)
                  </label>
                  <input
                    name="customer_phone"
                    type="text"
                    className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. 08123456789"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Harga Deal
                  </label>
                  <input
                    name="price"
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Rp 0"
                  />
                </div>

                <div className="rounded-xl border border-border-soft bg-muted p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Pembayaran Awal</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Nominal Pembayaran (Bisa 0 jika piutang total)
                      </label>
                      <input
                        name="payment_amount"
                        type="number"
                        min="0"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Rp 0"
                        defaultValue={0}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Metode Pembayaran
                      </label>
                      <select
                        name="account_id"
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Pilih Rekening (Kosongkan jika 0) --</option>
                        {accounts
                          .filter((a) => a.is_active)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border-soft bg-card p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Proses Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
