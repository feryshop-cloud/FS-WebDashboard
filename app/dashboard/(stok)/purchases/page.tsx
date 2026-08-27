"use client";

import React from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  X,
  Loader2,
  Download,
  Trash2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { usePurchases } from "@/lib/hooks/features/usePurchases";
import { Pagination } from "@/components/ui/Pagination";

export default function PurchasesPage() {
  const {
    data: { purchases, games, accounts, filteredPurchases, pageItems, safePage, itemsPerPage },
    isLoading,
    isSubmitting,
    isSettling,
    error,
    settleError,
    uiState: {
      isAddOpen,
      isAddClosing,
      isSettleOpen,
      isSettleClosing,
      selectedPurchaseToSettle,
      settleAccountId,
      searchQuery,
      statusFilter,
      isFilterDropdownOpen,
      selectedStatus,
    },
    refs: { filterButtonRef, filterMenuRef, addDrawerRef, settleModalRef },
    actions: {
      openAdd,
      closeAdd,
      openSettle,
      closeSettle,
      setSettleAccountId,
      handleSettlePurchase,
      handleAddPurchase,
      handleExportData,
      handleDeletePurchase,
      setSearchQuery,
      setStatusFilter,
      setIsFilterDropdownOpen,
      setPageNumber,
      setItemsPerPage,
      setSelectedStatus,
    },
  } = usePurchases();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Pembelian Stok</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Catat setiap pembelian akun dari penjual, harga modal, dan kewajiban pembayaran.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Catat Pembelian Baru
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari ID pembelian, item, atau supplier"
            className="border-border bg-muted text-foreground placeholder-placeholder block w-full rounded-lg border py-2 pr-3 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            placeholder="Cari ID pembelian, item, atau supplier..."
          />
        </div>
        <div className="relative flex w-full items-center gap-3 sm:w-auto">
          <button
            ref={filterButtonRef}
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={isFilterDropdownOpen}
            aria-controls="status-filter-listbox"
            className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-40 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <Filter className="text-faint-foreground h-4 w-4" />
              <span>
                {statusFilter === "ALL" && "Semua Status"}
                {statusFilter === "LUNAS" && "Lunas"}
                {statusFilter === "PENDING" && "Pending"}
              </span>
            </span>
            <ChevronDown
              className={`text-faint-foreground h-4 w-4 transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isFilterDropdownOpen && (
            <div
              id="status-filter-listbox"
              ref={filterMenuRef}
              role="listbox"
              aria-label="Filter status pembayaran"
              className="fs-drop-in border-border-soft bg-card absolute top-full right-0 z-10 mt-2 w-48 rounded-xl border py-1 shadow-lg"
            >
              <button
                role="option"
                aria-selected={statusFilter === "ALL"}
                onClick={() => {
                  setStatusFilter("ALL");
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-medium ${statusFilter === "ALL" ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"}`}
              >
                Semua Status
              </button>
              <button
                role="option"
                aria-selected={statusFilter === "LUNAS"}
                onClick={() => {
                  setStatusFilter("LUNAS");
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-medium ${statusFilter === "LUNAS" ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"}`}
              >
                Lunas
              </button>
              <button
                role="option"
                aria-selected={statusFilter === "PENDING"}
                onClick={() => {
                  setStatusFilter("PENDING");
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-medium ${statusFilter === "PENDING" ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"}`}
              >
                Pending
              </button>
            </div>
          )}
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
                  Tgl & ID Pembelian
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Item / Akun
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Supplier
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Harga Modal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Metode Pembayaran
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Status Pembayaran
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : !isLoading && purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Belum ada data pembelian stok.
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-muted-foreground text-sm">
                        Tidak ada hasil yang cocok dengan filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reset filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((purchase) => {
                  const isLunas = purchase.purchase_payment_status === "LUNAS";
                  const statusBadgeClass = isLunas
                    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50"
                    : "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50";

                  return (
                    <tr key={purchase.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-foreground font-mono text-xs font-semibold">
                            {purchase.sku || `STK-${purchase.id.slice(0, 6).toUpperCase()}`}
                          </span>
                          <span className="text-muted-foreground mt-0.5 text-[10px]">
                            {formatDate(purchase.purchase_date || purchase.created_at || "")}
                          </span>
                        </div>
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span
                            className="text-foreground block max-w-60 truncate font-semibold"
                            title={purchase.name ?? undefined}
                          >
                            {purchase.name}
                          </span>
                          <span className="text-faint-foreground mt-0.5 text-[10px]">
                            {purchase.category}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                        {purchase.seller_info || "-"}
                      </td>
                      <td className="text-foreground px-6 py-4 text-right text-sm font-bold whitespace-nowrap">
                        {formatRupiah(purchase.capital_price ?? 0)}
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        {purchase.accounts?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-[10px] px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClass}`}
                        >
                          {isLunas ? "Lunas" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {!isLunas && (
                            <button
                              onClick={() => openSettle(purchase)}
                              aria-label={`Lunasi pembelian ${purchase.name || purchase.sku || ""}`}
                              title="Lunasi Pembayaran"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                            >
                              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Bayar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePurchase(purchase.id, purchase.name)}
                            aria-label={`Hapus pembelian ${purchase.name || purchase.sku || ""}`}
                            title="Hapus Pembelian"
                            className="tap-large rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalItems={filteredPurchases.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setPageNumber(page)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setPageNumber(1);
          }}
          itemLabel="pembelian"
        />
      </div>

      {/* Buat Pembelian Baru Modal (Slide-over Drawer) */}
      {(isAddOpen || isAddClosing) && (
        <div
          ref={addDrawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-purchase-title"
          tabIndex={-1}
          onClick={closeAdd}
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 id="add-purchase-title" className="text-foreground text-lg font-bold">
                  Catat Pembelian Baru
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi form transaksi pembelian akun dari penjual.
                </p>
              </div>
              <button
                onClick={closeAdd}
                aria-label="Tutup form Catat Pembelian Baru"
                className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddPurchase}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Kategori Game
                  </label>
                  <select
                    name="category"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="">-- Pilih Game --</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.name}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Nama Item / Akun
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Mis. MLBB Mythic Glory 120 Skins"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Login Username/Email
                    </label>
                    <input
                      name="username"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Username/email"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Login Password
                    </label>
                    <input
                      name="password"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Spek / Detail Akun
                  </label>
                  <textarea
                    name="account_details"
                    rows={2}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Masukkan spesifikasi akun (heros, skins, winrate, dll)..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Modal
                    </label>
                    <input
                      name="capital_price"
                      required
                      type="number"
                      min="1"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Post Jual
                    </label>
                    <input
                      name="post_price"
                      required
                      type="number"
                      min="1"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Supplier / Penjual
                    </label>
                    <input
                      name="seller_info"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      placeholder="Nama seller/supplier"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Status Pembayaran
                    </label>
                    <select
                      name="purchase_payment_status"
                      required
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as "LUNAS" | "PENDING")}
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="LUNAS">Lunas</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                {selectedStatus === "LUNAS" && (
                  <div className="fs-drop-in rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Sumber Rekening / Metode Pembayaran
                    </label>
                    <select
                      name="payment_account_id"
                      required
                      className="border-border bg-card w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">-- Pilih Rekening Pembayaran --</option>
                      {accounts
                        .filter((a) => a.is_active)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({formatRupiah(acc.balance)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Catatan Internal (Opsional)
                  </label>
                  <textarea
                    name="internal_notes"
                    rows={2}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Catatan tambahan untuk internal..."
                  />
                </div>
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Catat Pembelian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pelunasan Pembelian Stok */}
      {(isSettleOpen || isSettleClosing) && selectedPurchaseToSettle && (
        <div
          ref={settleModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settle-purchase-title"
          tabIndex={-1}
          onClick={closeSettle}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity duration-200 ${
            isSettleClosing ? "opacity-0" : "opacity-100"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border-border bg-card w-full max-w-md rounded-2xl border shadow-xl transition-all duration-200 ${
              isSettleClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            <div className="border-border flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="settle-purchase-title" className="text-foreground text-base font-bold">
                    Pelunasan Pembelian Stok
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Bayar hutang kulakan akun ke supplier
                  </p>
                </div>
              </div>
              <button
                onClick={closeSettle}
                aria-label="Tutup modal"
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePurchase} className="space-y-4 p-5">
              {settleError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {settleError}
                </div>
              )}

              <div className="bg-muted/60 space-y-2 rounded-xl p-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item / Akun:</span>
                  <span className="text-foreground max-w-[200px] truncate text-right font-semibold">
                    {selectedPurchaseToSettle.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU / ID:</span>
                  <span className="text-foreground font-mono">
                    {selectedPurchaseToSettle.sku || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="text-foreground">
                    {selectedPurchaseToSettle.seller_info || "-"}
                  </span>
                </div>
                <div className="border-border/60 flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground font-medium">Nominal Pelunasan:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatRupiah(selectedPurchaseToSettle.capital_price ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-foreground mb-1.5 block text-xs font-semibold">
                  Sumber Dana / Rekening Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="border-border bg-card text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                >
                  <option value="">-- Pilih Rekening Kas / Bank --</option>
                  {accounts
                    .filter((acc) => acc.is_active)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatRupiah(acc.balance)})
                      </option>
                    ))}
                </select>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Saldo rekening yang dipilih akan otomatis terpotong dan tercatat di Buku Kas.
                </p>
              </div>

              <div className="border-border flex items-center justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={closeSettle}
                  disabled={isSettling}
                  className="border-border bg-card text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSettling || !settleAccountId}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSettling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Konfirmasi Pelunasan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
