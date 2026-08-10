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
import { useTopupProducts } from "@/lib/hooks/features/useTopupProducts";
import { AddTopupProductModal } from "@/components/topup/TopupProductModals";
import { TopupProductRowActions } from "@/components/topup/TopupProductRowActions";
import { Pagination } from "@/components/ui/Pagination";

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

  return (
    <div className="space-y-6 p-8">
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
      <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
        {error && (
          <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {isLoading ? (
          <div className="text-faint-foreground flex items-center justify-center py-16">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Memuat katalog produk Top-Up...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ShoppingBag className="text-faint-foreground mx-auto mb-3 h-12 w-12" />
            <h3 className="text-foreground text-base font-semibold">Tidak ada produk ditemukan</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Data master belum diisi atau filter yang dipilih tidak cocok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-muted-foreground w-full text-left text-sm">
              <thead className="border-border bg-muted text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5">Game</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Harga Jual</th>
                  <th className="px-6 py-3.5">Harga Modal</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="text-foreground px-6 py-4 font-medium">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.brand || "-"}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-6 py-4 font-mono text-xs">
                      {p.sku || "-"}
                    </td>
                    <td className="text-foreground px-6 py-4 font-semibold">
                      {formatRupiah(p.selling_price)}
                    </td>
                    <td className="text-muted-foreground px-6 py-4">
                      {formatRupiah(p.cost_price || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_gangguan ? (
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
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TopupProductRowActions product={p} onRefresh={() => loadProducts()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount || products.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => handleFilterChange("page", String(page))}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="produk"
          />
        )}
      </div>

      {/* Add Product Modal */}
      <AddTopupProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadProducts()}
      />
    </div>
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
