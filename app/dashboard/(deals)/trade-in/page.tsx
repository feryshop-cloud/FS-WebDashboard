"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  ArrowRightLeft,
  MoreHorizontal,
  Download,
  X,
  Loader2,
  ChevronDown,
  FileText,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { useTradeIn } from "@/lib/hooks/features/useTradeIn";
import { Pagination } from "@/components/ui/Pagination";

export default function TradeInPage() {
  const {
    data: {
      deals,
      stocks,
      accounts,
      selisih,
      filteredDeals,
      pageItems,
      safePage,
      itemsPerPage,
      deleteTarget,
      deleteError,
      isDeleting,
      editTarget,
    },
    isLoading,
    isSubmitting,
    error,
    uiState: { isAddTTOpen, isAddTTClosing, priceOut, ttValue, paymentAmount, searchQuery, statusFilter },
    actions: {
      openAddTT,
      closeAddTT,
      handleAddTT,
      setPriceOut,
      setTtValue,
      setPaymentAmount,
      setCurrentPage,
      setItemsPerPage,
      setSearchQuery,
      setStatusFilter,
      handleExportCSV,
      setDeleteTarget,
      handleDeleteDeal,
      openEditTT,
      closeEditTT,
      handleUpdateTT,
    },
  } = useTradeIn();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Tukar Tambah (Trade-In)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola transaksi pertukaran aset (akun customer) dengan stok Feryshop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors active:scale-[0.97]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={openAddTT}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Buat Transaksi TT
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4 shadow-sm">
        {/* Search */}
        <div className="relative min-w-50 flex-1">
          <Search className="text-faint-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-muted text-foreground w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            placeholder="Cari ID transaksi, nama customer..."
          />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-muted text-foreground w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="BOOKED">Booking</option>
            <option value="PAID">Lunas</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <ChevronDown className="text-faint-foreground pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" />
        </div>

        {(searchQuery || statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
            }}
            className="border-border bg-muted text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Cards/Table View for Complex TT Relationships */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="border-border-soft bg-card flex justify-center rounded-xl border p-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="border-border-soft bg-card text-muted-foreground rounded-xl border p-12 text-center text-sm shadow-sm">
            {deals.length === 0
              ? "Belum ada transaksi Tukar Tambah."
              : "Tidak ada transaksi Tukar Tambah yang cocok dengan pencarian."}
          </div>
        ) : (
          pageItems.map((tt) => {
            let badgeClass = "bg-muted text-muted-foreground border-border";
            if ((tt.status as string) === "Selesai" || (tt.status as string) === "Lunas")
              badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
            if ((tt.status as string) === "Booking")
              badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
            if ((tt.status as string)?.includes("Cancel"))
              badgeClass = "bg-rose-50 text-rose-600 border-rose-100";

            const stockOutName = tt.deal_items?.[0]?.stocks?.name || "N/A";
            const inItems = tt.trade_in_items || [];

            return (
              <div
                key={tt.id}
                className="group border-border-soft bg-card relative overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === tt.id ? null : tt.id);
                    }}
                    className="tap-large flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {openMenuId === tt.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg z-20">
                        <button
                          type="button"
                          onClick={() => {
                            openEditTT(tt);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Edit Skema
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(tt);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Header */}
                <div className="border-border-soft/50 bg-muted/30 flex items-center gap-4 border-b px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/deals/${tt.id}`} className="hover:underline">
                        <h2 className="text-foreground text-sm font-bold">{tt.deal_number}</h2>
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                      >
                        {tt.status as string}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                      {(tt.customers as { name?: string | null } | null)?.name || "-"} •{" "}
                      {formatDate(tt.created_at as string)}
                    </p>
                  </div>
                </div>

                {/* TT Content */}
                <div className="grid grid-cols-1 items-center gap-6 px-6 py-5 lg:grid-cols-12">
                  {/* INWARD (Customer Aset Masuk) */}
                  <div className="col-span-1 flex flex-col gap-3 lg:col-span-4">
                    <h3 className="text-faint-foreground text-[10px] font-bold tracking-wider uppercase">
                      Aset Customer (Masuk)
                    </h3>
                    <div className="space-y-2">
                      {(inItems as Array<{ description?: unknown; estimated_value?: unknown }>).map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="border-border-soft bg-muted flex items-center justify-between rounded-lg border p-2.5"
                          >
                            <span
                              className="text-foreground mr-2 truncate text-xs font-semibold"
                              title={String(item.description ?? "")}
                            >
                              {String(item.description ?? "")}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              {formatRupiah(Number(item.estimated_value ?? 0))}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* ARROW SEPARATOR */}
                  <div className="hidden justify-center lg:col-span-1 lg:flex">
                    <ArrowRightLeft className="text-faint-foreground h-6 w-6" />
                  </div>

                  {/* OUTWARD (Stok Feryshop Keluar) */}
                  <div className="col-span-1 flex flex-col gap-3 lg:col-span-4">
                    <h3 className="text-faint-foreground text-[10px] font-bold tracking-wider uppercase">
                      Stok Feryshop (Keluar)
                    </h3>
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                      <span
                        className="text-foreground mr-2 truncate text-xs font-semibold"
                        title={stockOutName}
                      >
                        {stockOutName}
                      </span>
                      <span className="text-foreground text-xs font-bold">
                        {formatRupiah(Number(tt.total_deal_price))}
                      </span>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className="border-border-soft lg:border-border-soft col-span-1 mt-4 flex h-full flex-col items-end justify-center border-t pt-4 lg:col-span-3 lg:mt-0 lg:border-l lg:pt-0 lg:pl-6">
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Nilai Transaksi Feryshop
                    </span>
                    <span className="text-foreground mt-1 text-xl font-bold tracking-tight">
                      {formatRupiah(Number(tt.total_deal_price))}
                    </span>

                    <Link
                      href={`/dashboard/deals/${tt.id}`}
                      className="mt-4 w-full rounded-md bg-blue-50 px-3 py-1.5 text-center text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 sm:w-auto inline-block"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={safePage}
        totalItems={filteredDeals.length}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        itemLabel="transaksi"
      />

      {/* Buat TT Baru Modal */}
      {(isAddTTOpen || isAddTTClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddTTClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeAddTT}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddTTClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-lg font-bold">Transaksi Tukar Tambah</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi detail aset masuk dan keluar.
                </p>
              </div>
              <button
                onClick={closeAddTT}
                className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddTT} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                {/* Customer Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Data Customer
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Nama Customer
                    </label>
                    <input
                      name="customer_name"
                      required
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Mis. 08123456789"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Feryshop Out Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Stok Keluar (Feryshop)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Pilih Stok
                    </label>
                    <select
                      name="stock_out_id"
                      required
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                      Harga Deal (Nilai Stok Keluar)
                    </label>
                    <input
                      name="price_out"
                      required
                      type="number"
                      min="1"
                      value={priceOut || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriceOut(val);
                        setPaymentAmount(Math.abs(val - ttValue));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Customer In Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Aset Masuk (Dari Customer)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Deskripsi Aset TT
                    </label>
                    <input
                      name="tt_desc"
                      required
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Mis. Akun MLBB Mythic"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Estimasi Nilai Aset Masuk
                    </label>
                    <input
                      name="tt_value"
                      required
                      type="number"
                      min="1"
                      value={ttValue || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTtValue(val);
                        setPaymentAmount(Math.abs(priceOut - val));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                {/* Selisih & Payment Calculation */}
                {(priceOut > 0 || ttValue > 0) && (
                  <div
                    className={`fs-drop-in rounded-xl border p-4 ${selisih < 0 ? "border-emerald-100 bg-emerald-50" : selisih > 0 ? "border-rose-100 bg-rose-50" : "border-border-soft bg-muted"}`}
                  >
                    <h3 className="text-foreground mb-2 text-sm font-semibold">
                      Selisih Transaksi
                    </h3>
                    <div className="text-muted-foreground mb-3 text-xs">
                      {selisih < 0 ? (
                        <span>
                          Customer <strong className="text-emerald-700">tambah uang</strong>{" "}
                          sebesar:
                        </span>
                      ) : selisih > 0 ? (
                        <span>
                          Feryshop <strong className="text-rose-700">bayar cashback</strong>{" "}
                          sebesar:
                        </span>
                      ) : (
                        <span>Tukar guling (tanpa tambah/cashback).</span>
                      )}
                    </div>
                    <div className="text-foreground mb-4 text-lg font-bold">
                      {formatRupiah(Math.abs(selisih))}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="hidden"
                        name="payment_direction"
                        value={selisih < 0 ? "IN" : "OUT"}
                      />
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Uang Tunai yang Dibayarkan
                        </label>
                        <input
                          name="payment_amount"
                          type="number"
                          min="0"
                          value={paymentAmount || ""}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          placeholder="Rp 0"
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Pilih Rekening Transaksi
                        </label>
                        <select
                          name="account_id"
                          required={paymentAmount > 0}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          <option value="">-- Rekening (Wajib jika ada tunai) --</option>
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
                )}
              </div>
              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Proses Tukar Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaksi TT Modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm fs-overlay-in"
          onClick={closeEditTT}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card flex h-full w-full max-w-md flex-col shadow-2xl fs-drawer-in"
          >
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-lg font-bold">Edit Transaksi Tukar Tambah</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Ubah detail aset masuk dan keluar untuk {editTarget.deal_number}.
                </p>
              </div>
              <button
                onClick={closeEditTT}
                className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleUpdateTT} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                {/* Customer Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Data Customer
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Nama Customer
                    </label>
                    <input
                      name="customer_name"
                      required
                      type="text"
                      defaultValue={(editTarget.customers as { name?: string | null } | null)?.name || ""}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                      defaultValue={(editTarget.customers as { phone?: string | null } | null)?.phone || ""}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Mis. 08123456789"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Feryshop Out Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Stok Keluar (Feryshop)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Pilih Stok
                    </label>
                    <select
                      name="stock_out_id"
                      required
                      defaultValue={(editTarget.deal_items?.[0] as { stock_id?: string } | undefined)?.stock_id || ""}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">-- Pilih Stok Tersedia --</option>
                      {(() => {
                        const dealItem = editTarget.deal_items?.[0] as { stock_id?: string; stocks?: { name?: string } | null } | undefined;
                        const editStock = dealItem?.stocks;
                        const editStockId = dealItem?.stock_id;
                        const allStocks = [...stocks];
                        if (editStock && editStockId && !allStocks.some((s) => s.id === editStockId)) {
                          allStocks.unshift({
                            id: editStockId,
                            title_reference: editStock.name || "Stok Saat Ini (Selesai/Terjual)",
                          } as any);
                        }
                        return allStocks.map((stock) => (
                          <option key={stock.id} value={stock.id}>
                            {stock.title_reference}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Deal (Nilai Stok Keluar)
                    </label>
                    <input
                      name="price_out"
                      required
                      type="number"
                      min="1"
                      value={priceOut || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriceOut(val);
                        setPaymentAmount(Math.abs(val - ttValue));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Customer In Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Aset Masuk (Dari Customer)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Deskripsi Aset TT
                    </label>
                    <input
                      name="tt_desc"
                      required
                      type="text"
                      defaultValue={(editTarget.trade_in_items?.[0] as { description?: string } | undefined)?.description || ""}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Mis. Akun MLBB Mythic"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Estimasi Nilai Aset Masuk
                    </label>
                    <input
                      name="tt_value"
                      required
                      type="number"
                      min="1"
                      value={ttValue || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTtValue(val);
                        setPaymentAmount(Math.abs(priceOut - val));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                {/* Selisih & Payment Calculation */}
                {(priceOut > 0 || ttValue > 0) && (
                  <div
                    className={`fs-drop-in rounded-xl border p-4 ${selisih < 0 ? "border-emerald-100 bg-emerald-50" : selisih > 0 ? "border-rose-100 bg-rose-50" : "border-border-soft bg-muted"}`}
                  >
                    <h3 className="text-foreground mb-2 text-sm font-semibold">
                      Selisih Transaksi
                    </h3>
                    <div className="text-muted-foreground mb-3 text-xs">
                      {selisih < 0 ? (
                        <span>
                          Customer <strong className="text-emerald-700">tambah uang</strong>{" "}
                          sebesar:
                        </span>
                      ) : selisih > 0 ? (
                        <span>
                          Feryshop <strong className="text-rose-700">bayar cashback</strong>{" "}
                          sebesar:
                        </span>
                      ) : (
                        <span>Tukar guling (tanpa tambah/cashback).</span>
                      )}
                    </div>
                    <div className="text-foreground mb-4 text-lg font-bold">
                      {formatRupiah(Math.abs(selisih))}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="hidden"
                        name="payment_direction"
                        value={selisih < 0 ? "IN" : "OUT"}
                      />
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Uang Tunai yang Dibayarkan
                        </label>
                        <input
                          name="payment_amount"
                          type="number"
                          min="0"
                          value={paymentAmount || ""}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          placeholder="Rp 0"
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Pilih Rekening Transaksi
                        </label>
                        <select
                          name="account_id"
                          required={paymentAmount > 0}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          <option value="">-- Rekening (Wajib jika ada tunai) --</option>
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
                )}
              </div>
              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hapus TT Konfirmasi Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fs-overlay-in"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-xl p-6 shadow-2xl fs-rise-in border border-border"
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-foreground text-lg font-bold">
                Hapus Transaksi Tukar Tambah
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus transaksi Tukar Tambah{" "}
              <strong className="text-foreground font-semibold">
                {deleteTarget.deal_number}
              </strong>
              ? Aset masuk dan deal item yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDeal(deleteTarget.id)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus Transaksi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
