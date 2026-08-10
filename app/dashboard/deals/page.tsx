"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  FileText,
  ChevronDown,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getDeals, createPenjualan, deleteDeal } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
import { Pagination } from "@/components/ui/Pagination";
import type { Database } from "@/types/database.types";
import { DealWithRelations } from "@/types/database";

type Deal = DealWithRelations;
type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};
type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function DealsPage() {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isAddDealClosing, setIsAddDealClosing] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const closeAddDeal = () => {
    if (isAddDealClosing || isSubmitting) return;
    setIsAddDealClosing(true);
    setTimeout(() => {
      setIsAddDealClosing(false);
      setIsAddDealOpen(false);
    }, 200);
  };

  const openAddDeal = () => {
    if (isAddDealClosing) return;
    setIsAddDealOpen(true);
  };

  const handleAddDeal = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createPenjualan(formData);
      loadData();
      closeAddDeal();
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

  const handleDeleteDeal = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteDeal(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(deals.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = deals.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Daftar Transaksi (Deals)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola semua transaksi penjualan reguler, booking, dan cicilan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </button>
          <button
            onClick={openAddDeal}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Buat Deal Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            className="border-border bg-muted text-foreground block w-full rounded-lg border py-2 pr-3 pl-10 placeholder-placeholder transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:text-sm"
            placeholder="Cari nomor deal, customer, atau stok..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="text-faint-foreground h-4 w-4" />
              <span>Semua Status</span>
            </div>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto">
            <span>Pilih Tanggal</span>
            <ChevronDown className="text-faint-foreground h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/80">
              <tr>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Nomor Deal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Stok yang Dijual
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Harga Deal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Total Dibayar
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Status Deal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Tanggal Deal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft bg-card divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Tidak ada transaksi pada halaman ini.
                  </td>
                </tr>
              ) : (
                pageItems.map((deal) => {
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
                    <tr key={deal.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="text-foreground px-6 py-4 text-sm font-semibold whitespace-nowrap">
                        {deal.deal_number}
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {deal.customers?.name || "-"}
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                        <span className="block max-w-[200px] truncate" title={stockName}>
                          {stockName}
                        </span>
                      </td>
                      <td className="text-foreground px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
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
                            <span className="text-faint-foreground mt-0.5 text-[10px] font-medium">
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
                      <td className="text-muted-foreground px-6 py-4 text-right text-sm whitespace-nowrap">
                        {formatDate(deal.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(deal)}
                          title="Hapus Deal"
                          aria-label={`Hapus deal ${deal.deal_number}`}
                          className="tap-large rounded-md text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
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

        {/* Pagination */}
        <Pagination
          currentPage={safePage}
          totalItems={deals.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          itemLabel="transaksi"
        />
      </div>

      {/* Buat Deal Baru Modal (Slide-over / Modal) */}
      {(isAddDealOpen || isAddDealClosing) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deal-drawer-title"
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddDealClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeAddDeal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddDealClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 id="deal-drawer-title" className="text-foreground text-lg font-bold">
                  Buat Deal Baru
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi form transaksi penjualan atau booking.
                </p>
              </div>
              <button
                onClick={closeAddDeal}
                aria-label="Tutup form Buat Deal Baru"
                className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              action={handleAddDeal}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Pilih Stok
                  </label>
                  <select
                    name="stock_id"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
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
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Nama Customer
                  </label>
                  <input
                    name="customer_name"
                    required
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Mis. Budi Santoso"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    No. HP Customer (Opsional)
                  </label>
                  <input
                    name="customer_phone"
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Mis. 08123456789"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Harga Deal
                  </label>
                  <input
                    name="price"
                    required
                    type="number"
                    min="1"
                    className="border-border w-full rounded-lg border px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Rp 0"
                  />
                </div>

                <div className="border-border-soft bg-muted rounded-xl border p-4">
                  <h3 className="text-foreground mb-3 text-sm font-semibold">Pembayaran Awal</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        Nominal Pembayaran (Bisa 0 jika piutang total)
                      </label>
                      <input
                        name="payment_amount"
                        type="number"
                        min="0"
                        className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                        placeholder="Rp 0"
                        defaultValue={0}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        Metode Pembayaran
                      </label>
                      <select
                        name="account_id"
                        className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
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
              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-purple-200 transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Proses Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hapus Deal Confirmation Dialogs */}
      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-deal-title"
          aria-describedby="delete-deal-desc"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="border-border bg-card w-full max-w-sm rounded-xl border p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 id="delete-deal-title" className="text-foreground text-lg font-bold">
                Hapus Deal?
              </h3>
            </div>
            <p id="delete-deal-desc" className="text-muted-foreground mb-4 text-sm">
              Apakah Anda yakin ingin menghapus transaksi{" "}
              <span className="text-foreground font-semibold">
                {deleteTarget.deal_number}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteDeal}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
