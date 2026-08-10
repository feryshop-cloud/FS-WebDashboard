"use client";

import React from "react";
import { Search, Filter, Plus, ChevronDown, Download, X, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { InventoryRowActions } from "@/components/inventory/InventoryRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { useInventory } from "@/lib/hooks/features/useInventory";

export default function InventoryPage() {
  const {
    data: { inventory, games, displayedInventory, pageItems, safePage },
    isLoading,
    isSubmitting,
    isExporting,
    error,
    uiState: {
      activeCategory,
      activeStatus,
      searchQuery,
      itemsPerPage,
      isAddStockOpen,
      isAddStockClosing,
      isCategoryDropdownOpen,
      isStatusDropdownOpen,
    },
    refs: { categoryButtonRef, categoryMenuRef, statusButtonRef, statusMenuRef, addStockRef },
    actions: {
      openAddStock,
      closeAddStock,
      handleAddStock,
      handleExportExcel,
      setActiveCategory,
      setActiveStatus,
      setSearchQuery,
      setCurrentPage,
      setItemsPerPage,
      setIsCategoryDropdownOpen,
      setIsStatusDropdownOpen,
      loadInventory,
    },
  } = useInventory();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Manajemen Stok</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola seluruh stok akun game, harga modal, dan status ketersediaan.
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
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Mengekspor..." : "Export Data"}
          </button>
          <button
            onClick={openAddStock}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Tambah Stok
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
            className="border-border bg-muted text-foreground placeholder-placeholder block w-full rounded-lg border py-2 pr-3 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari ID stok, kategori, atau nama akun..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <button
              ref={categoryButtonRef}
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              aria-expanded={isCategoryDropdownOpen}
              aria-haspopup="menu"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-35 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto"
            >
              <div className="flex items-center gap-2">
                <Filter className="text-faint-foreground h-4 w-4" />
                <span>{activeCategory}</span>
              </div>
              <ChevronDown className="text-faint-foreground h-4 w-4" />
            </button>
            {isCategoryDropdownOpen && (
              <div
                ref={categoryMenuRef}
                role="menu"
                className="border-border bg-card absolute right-0 z-30 mt-1 w-48 rounded-lg border py-1 shadow-lg"
              >
                {["Semua", ...games.map((g) => g.name)].map((name) => (
                  <button
                    key={name}
                    role="menuitem"
                    onClick={() => {
                      setActiveCategory(name);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`hover:bg-muted block w-full px-4 py-2 text-left text-sm ${
                      activeCategory === name ? "font-semibold text-blue-600" : "text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative w-full sm:w-auto">
            <button
              ref={statusButtonRef}
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              aria-expanded={isStatusDropdownOpen}
              aria-haspopup="menu"
              className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-35 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto"
            >
              <span>{activeStatus}</span>
              <ChevronDown className="text-faint-foreground h-4 w-4" />
            </button>
            {isStatusDropdownOpen && (
              <div
                ref={statusMenuRef}
                role="menu"
                className="border-border bg-card absolute right-0 z-30 mt-1 w-48 rounded-lg border py-1 shadow-lg"
              >
                {["Semua Status", "UNPOSTED", "AVAILABLE", "SOLD"].map((status) => (
                  <button
                    key={status}
                    role="menuitem"
                    onClick={() => {
                      setActiveStatus(status);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`hover:bg-muted block w-full px-4 py-2 text-left text-sm ${
                      activeStatus === status ? "font-semibold text-blue-600" : "text-foreground"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("Semua")}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeCategory === "Semua"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          Semua
        </button>
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveCategory(game.name)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === game.name
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {game.name}
          </button>
        ))}
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
                  ID Stok
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Kategori Game
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase"
                >
                  Nama / Kode Stok
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Harga Modal
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase"
                >
                  Harga Jual
                </th>
                <th
                  scope="col"
                  className="text-muted-foreground px-6 py-4 text-center text-xs font-semibold tracking-wider uppercase"
                >
                  Status Stok
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
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Belum ada data stok.
                  </td>
                </tr>
              ) : displayedInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-8 text-center text-sm">
                    Tidak ada stok yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => {
                  let badgeClass = "bg-muted text-muted-foreground border-border";
                  const statusStr = item.status || "UNPOSTED";

                  if (statusStr === "AVAILABLE") {
                    badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  } else if (statusStr === "SOLD") {
                    badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                  } else if (statusStr === "UNPOSTED") {
                    badgeClass = "bg-muted text-muted-foreground border-border";
                  }

                  return (
                    <tr key={item.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="text-foreground px-6 py-4 text-sm font-semibold whitespace-nowrap">
                        <span
                          className="block max-w-36 truncate"
                          title={item.public_id || item.title_reference || "-"}
                        >
                          {item.public_id || item.title_reference || "-"}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <span className="bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-[11px] font-semibold">
                          {item.games?.name || "-"}
                        </span>
                      </td>
                      <td className="text-foreground px-6 py-4 text-sm">
                        <span
                          className="block max-w-62.5 truncate font-medium"
                          title={item.title_reference || "-"}
                        >
                          {item.title_reference || "-"}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums">
                        {formatRupiah(Number(item.capital_price))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <span className="text-foreground font-mono text-sm font-bold tabular-nums">
                          {formatRupiah(Number(item.asking_price))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}
                        >
                          {statusStr}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <InventoryRowActions item={item} games={games} onRefresh={loadInventory} />
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
          totalItems={displayedInventory.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          itemLabel="stok"
        />
      </div>

      {/* Tambah Stok Modal (Slide-over Drawer) */}
      {(isAddStockOpen || isAddStockClosing) && (
        <div
          ref={addStockRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-stock-drawer-title"
          tabIndex={-1}
          onClick={closeAddStock}
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddStockClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddStockClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 id="add-stock-drawer-title" className="text-foreground text-lg font-bold">
                  Tambah Stok Baru
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi form data stok akun game baru.
                </p>
              </div>
              <button
                onClick={closeAddStock}
                aria-label="Tutup form Tambah Stok Baru"
                className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={handleAddStock}
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
                    name="game_id"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Pilih Kategori Game...</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Kode Referensi
                  </label>
                  <input
                    name="title_reference"
                    type="text"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. ML-MYTHIC-001"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Spesifikasi Akun
                  </label>
                  <textarea
                    name="account_specs"
                    required
                    rows={3}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Details like rank, skins, win rate..."
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
                      min="0"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Target Jual
                    </label>
                    <input
                      name="asking_price"
                      required
                      type="number"
                      min="0"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Stok</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
