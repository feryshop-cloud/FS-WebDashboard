"use client";

import React, { Suspense } from "react";
import {
  Search,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Plus,
  ChevronDown,
  X,
  ArrowUpDown,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useTopupProducts, TopupProduct } from "@/lib/hooks/features/useTopupProducts";
import { AddTopupProductModal } from "@/components/topup/TopupProductModals";
import { TopupProductRowActions } from "@/components/topup/TopupProductRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

function TopupProductsContent() {
  const {
    data: { products, totalCount, currentPage, itemsPerPage },
    isLoading,
    error,
    uiState: {
      isAddModalOpen,
      searchQuery,
      sortBy,
      sortOrder,
      isActiveFilter,
      isGangguanFilter,
      hasActiveFilters,
    },
    actions: {
      setIsAddModalOpen,
      handleFilterChange,
      handleResetFilters,
      handlePageSizeChange,
      handleSortChange,
      loadProducts,
    },
  } = useTopupProducts();

  const sortOptions = [
    { value: "game_slug", label: "Game" },
    { value: "title", label: "Nama Produk" },
    { value: "selling_price", label: "Harga Jual" },
    { value: "cost_price", label: "Harga Modal" },
    { value: "is_active", label: "Status Aktif" },
    { value: "is_gangguan", label: "Status Gangguan" },
  ];

  const columns: DataTableColumn<TopupProduct>[] = [
    {
      key: "title",
      header: "Nama Produk",
      render: (p) => <span className="text-foreground font-medium">{p.title}</span>,
    },
    {
      key: "game",
      header: "Game",
      render: (p) => (
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {p.brand || "-"}
        </span>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      className: "text-muted-foreground font-mono text-xs",
      render: (p) => p.sku || "-",
    },
    {
      key: "selling_price",
      header: "Harga Jual",
      className: "text-foreground font-semibold",
      render: (p) => formatRupiah(p.selling_price),
    },
    {
      key: "cost_price",
      header: "Harga Modal",
      className: "text-muted-foreground",
      render: (p) => formatRupiah(p.cost_price || 0),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p) =>
        p.is_gangguan ? (
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Gangguan
          </span>
        ) : p.is_active ? (
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Aktif
          </span>
        ) : (
          <span className="border-border bg-muted text-muted-foreground inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
            Nonaktif
          </span>
        ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "center",
      render: (p) => <TopupProductRowActions product={p} onRefresh={() => loadProducts()} />,
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Daftar Produk Top-Up
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitoring & Kelola katalog produk Top-Up Storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="bg-muted text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-50 flex-1">
            <Search className="text-faint-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama produk, game slug, atau SKU..."
              value={searchQuery}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="border-border bg-muted w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="relative min-w-40">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border-border bg-muted w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Urutkan: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="text-faint-foreground pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" />
          </div>

          {/* Sort Order */}
          <button
            onClick={() => handleSortChange(sortBy)}
            className="border-border bg-muted text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            title="Balik urutan sortir"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "asc" ? "Naik" : "Turun"}
          </button>

          {/* Status Aktif Filter */}
          <select
            value={isActiveFilter}
            onChange={(e) => handleFilterChange("isActive", e.target.value)}
            className="border-border bg-muted appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>

          {/* Gangguan Filter */}
          <select
            value={isGangguanFilter}
            onChange={(e) => handleFilterChange("isGangguan", e.target.value)}
            className="border-border bg-muted appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">Semua Kondisi</option>
            <option value="true">Gangguan</option>
            <option value="false">Normal</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="border-border bg-muted text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content / Table */}
      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada produk ditemukan"
        emptyContent="Data master belum diisi atau filter yang dipilih tidak cocok."
        footer={
          !isLoading &&
          products.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalCount || products.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => handleFilterChange("page", String(page))}
              onPageSizeChange={handlePageSizeChange}
              itemLabel="produk"
            />
          )
        }
      />

      {/* Add Product Modal */}
      <AddTopupProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadProducts()}
      />
    </>
  );
}

export default function TopupProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TopupProductsContent />
    </Suspense>
  );
}
