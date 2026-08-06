"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { getTopupProducts } from "@/app/actions/topup-products";
import { AddTopupProductModal } from "@/components/topup/TopupProductModals";
import { TopupProductRowActions } from "@/components/topup/TopupProductRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { useRouter, useSearchParams } from "next/navigation";

type TopupProduct = {
  id: string;
  game_slug: string;
  title: string;
  selling_price: number;
  cost_price: number;
  sku: string | null;
  is_active: boolean;
  is_gangguan: boolean;
};

export default function TopupProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<TopupProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "game_slug";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const isActiveFilter = searchParams.get("isActive") || "";
  const isGangguanFilter = searchParams.get("isGangguan") || "";

  const loadProducts = useCallback(
    async (filters: {
      page?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      isActive?: string;
      isGangguan?: string;
    } = {}) => {
      try {
        setIsLoading(true);
        setError("");
        const res = await getTopupProducts({
          page: filters.page ?? currentPage,
          limit: itemsPerPage,
          search: filters.search ?? searchQuery,
          sortBy: filters.sortBy ?? sortBy,
          sortOrder: (filters.sortOrder ?? sortOrder) as "asc" | "desc",
          isActive: filters.isActive ?? isActiveFilter,
          isGangguan: filters.isGangguan ?? isGangguanFilter,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setProducts((res.data as TopupProduct[]) || []);
          setTotalCount(res.totalCount || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengambil data produk");
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, searchQuery, sortBy, sortOrder, isActiveFilter, isGangguanFilter],
  );

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadProducts]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push("/dashboard/topup-products");
  };

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      params.set("sortOrder", newOrder);
    } else {
      params.set("sortBy", newSortBy);
      params.set("sortOrder", "asc");
    }
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
  };

  const hasActiveFilters = searchQuery || isActiveFilter || isGangguanFilter || sortBy !== "game_slug" || sortOrder !== "asc";

  const sortOptions = [
    { value: "game_slug", label: "Game Slug" },
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Daftar Produk Top-Up
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring & Kelola katalog produk Top-Up Storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama produk, game slug, atau SKU..."
              value={searchQuery}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-lg border border-border bg-muted py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="relative min-w-[160px]">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-muted py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Urutkan: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
          </div>

          {/* Sort Order */}
          <button
            onClick={() => handleSortChange(sortBy)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            title="Balik urutan sortir"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "asc" ? "Naik" : "Turun"}
          </button>

          {/* Status Aktif Filter */}
          <select
            value={isActiveFilter}
            onChange={(e) => handleFilterChange("isActive", e.target.value)}
            className="appearance-none rounded-lg border border-border bg-muted py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>

          {/* Gangguan Filter */}
          <select
            value={isGangguanFilter}
            onChange={(e) => handleFilterChange("isGangguan", e.target.value)}
            className="appearance-none rounded-lg border border-border bg-muted py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">Semua Kondisi</option>
            <option value="true">Gangguan</option>
            <option value="false">Normal</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content / Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {error && (
          <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-faint-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Memuat katalog produk Top-Up...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-faint-foreground" />
            <h3 className="text-base font-semibold text-foreground">Tidak ada produk ditemukan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Data master belum diisi atau filter yang dipilih tidak cocok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="border-b border-border bg-muted text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5">Game Slug</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Harga Jual</th>
                  <th className="px-6 py-3.5">Harga Modal</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-foreground">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.game_slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.sku || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {formatRupiah(p.selling_price)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatRupiah(p.cost_price || 0)}</td>
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
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
