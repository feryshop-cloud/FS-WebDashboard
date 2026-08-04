"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Loader2, RefreshCw, Plus } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getTopupProducts } from "@/app/actions/topup-products";
import { AddTopupProductModal } from "@/components/topup/TopupProductModals";
import { TopupProductRowActions } from "@/components/topup/TopupProductRowActions";

import { Pagination } from "@/components/ui/Pagination";

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
  const [products, setProducts] = useState<TopupProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const loadProducts = async (page = currentPage) => {
    try {
      setIsLoading(true);
      setError("");
      const res = await getTopupProducts(page, itemsPerPage);

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
  };

  useEffect(() => {
    let isMounted = true;
    getTopupProducts(currentPage, itemsPerPage)
      .then((res) => {
        if (isMounted) {
          if (res.error) {
            setError(res.error);
          } else {
            setProducts((res.data as TopupProduct[]) || []);
            setTotalCount(res.totalCount || 0);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Gagal mengambil data produk");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.game_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Daftar Produk Top-Up
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring & Kelola katalog produk Top-Up Storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
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

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, game slug, atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Content / Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {error && (
          <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Memuat katalog produk Top-Up...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada produk ditemukan</h3>
            <p className="mt-1 text-sm text-slate-500">
              Data master belum diisi atau kata kunci pencarian tidak cocok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
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
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.game_slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatRupiah(p.selling_price)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatRupiah(p.cost_price || 0)}</td>
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
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TopupProductRowActions product={p} onRefresh={loadProducts} />
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
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="produk"
          />
        )}
      </div>

      {/* Add Product Modal */}
      <AddTopupProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadProducts}
      />
    </div>
  );
}
