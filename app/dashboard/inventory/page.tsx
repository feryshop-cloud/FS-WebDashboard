"use client";

import React from "react";
import { Plus, Download, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { InventoryRowActions } from "@/components/inventory/InventoryRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterDropdown, type FilterDropdownOption } from "@/components/ui/FilterDropdown";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { useInventory } from "@/lib/hooks/features/useInventory";

interface InventoryRow {
  id: string;
  status: string | null;
  public_id?: string | null;
  title_reference?: string | null;
  capital_price?: number | null;
  asking_price?: number | null;
  games?: { name: string } | null;
}

export default function InventoryPage() {
  const {
    data: { games, displayedInventory, pageItems, safePage },
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
    },
    refs: { addStockRef },
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
      loadInventory,
    },
  } = useInventory();

  const categoryOptions: FilterDropdownOption[] = [
    { value: "Semua", label: "Semua Kategori" },
    ...games.map((g) => ({ value: g.name, label: g.name })),
  ];

  const statusOptions: FilterDropdownOption[] = [
    { value: "Semua Status", label: "Semua Status" },
    { value: "UNPOSTED", label: "UNPOSTED" },
    { value: "AVAILABLE", label: "AVAILABLE" },
    { value: "SOLD", label: "SOLD" },
  ];

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: "id",
      header: "ID Stok",
      render: (item) => (
        <span
          className="text-foreground block max-w-36 truncate text-sm font-semibold whitespace-nowrap"
          title={item.public_id || item.title_reference || "-"}
        >
          {item.public_id || item.title_reference || "-"}
        </span>
      ),
    },
    {
      key: "game",
      header: "Kategori Game",
      render: (item) => (
        <span className="bg-muted text-muted-foreground rounded-md px-2.5 py-1 text-[11px] font-semibold">
          {item.games?.name || "-"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Nama / Kode Stok",
      render: (item) => (
        <span
          className="text-foreground block max-w-62.5 truncate font-medium"
          title={item.title_reference || "-"}
        >
          {item.title_reference || "-"}
        </span>
      ),
    },
    {
      key: "capital",
      header: "Harga Modal",
      align: "right",
      className: "font-mono text-sm font-medium whitespace-nowrap tabular-nums text-muted-foreground",
      render: (item) => formatRupiah(Number(item.capital_price)),
    },
    {
      key: "asking",
      header: "Harga Jual",
      align: "right",
      className: "whitespace-nowrap",
      render: (item) => (
        <span className="text-foreground font-mono text-sm font-bold tabular-nums">
          {formatRupiah(Number(item.asking_price))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status Stok",
      align: "center",
      render: (item) => <InventoryStatusBadge status={item.status || "UNPOSTED"} />,
    },
    {
      key: "actions",
      header: "Aksi",
      align: "center",
      className: "text-sm font-medium whitespace-nowrap",
      render: (item) => (
        <InventoryRowActions
          item={
            item as Parameters<typeof InventoryRowActions>[0]["item"] & {
              status: string | null;
            }
          }
          games={games as Parameters<typeof InventoryRowActions>[0]["games"]}
          onRefresh={loadInventory}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      <PageHeader
        title="Manajemen Stok"
        subtitle="Kelola seluruh stok akun game, harga modal, dan status ketersediaan."
        actions={
          <>
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
          </>
        }
      />

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari ID stok, kategori, atau nama akun..."
        />
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <FilterDropdown
            value={activeCategory}
            onSelect={setActiveCategory}
            options={categoryOptions}
            ariaLabel="Filter kategori game"
          />
          <FilterDropdown
            value={activeStatus}
            onSelect={setActiveStatus}
            options={statusOptions}
            withIcon={false}
            ariaLabel="Filter status stok"
          />
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

      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Belum ada data stok."
        emptyContent={
          displayedInventory.length === 0
            ? "Belum ada data stok."
            : "Tidak ada stok yang cocok dengan pencarian atau filter."
        }
        footer={
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
        }
      />

      {/* Tambah Stok Modal (Slide-over Drawer) */}
      {(isAddStockOpen || isAddStockClosing) && (
        <SlideOverDrawer
          open={isAddStockOpen}
          closing={isAddStockClosing}
          onClose={closeAddStock}
          title="Tambah Stok Baru"
          subtitle="Isi form data stok akun game baru."
          labelledById="add-stock-drawer-title"
          drawerRef={addStockRef as React.Ref<HTMLDivElement>}
        >
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
        </SlideOverDrawer>
      )}
    </div>
  );
}

function InventoryStatusBadge({ status }: { status: string }) {
  if (status === "AVAILABLE") return <StatusBadge label="AVAILABLE" tone="emerald" />;
  if (status === "SOLD") return <StatusBadge label="SOLD" tone="blue" />;
  return <StatusBadge label={status} tone="neutral" />;
}