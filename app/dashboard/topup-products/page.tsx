'use client'

import React, { useState, useEffect } from 'react'
import { Search, ShoppingBag, Loader2, RefreshCw } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type TopupProduct = {
  id: string
  game_slug: string
  title: string
  selling_price: number
  cost_price: number
  sku: string | null
  is_active: boolean
  is_gangguan: boolean
}

export default function TopupProductsPage() {
  const [products, setProducts] = useState<TopupProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError('')
      const supabase = createClient()
      const { data, error: fetchError } = await (supabase
        .from('products' as any)
        .select('*')
        .order('game_slug', { ascending: true }) as any)

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProducts(data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data produk')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.game_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Daftar Produk Top-Up
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoring produk katalog Top-Up Storefront dari database Supabase.
          </p>
        </div>
        <button
          onClick={loadProducts}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, game slug, atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Memuat katalog produk Top-Up...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada produk ditemukan</h3>
            <p className="text-sm text-slate-500 mt-1">
              Data master belum diisi atau kata kunci pencarian tidak cocok.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5">Game Slug</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Harga Jual</th>
                  <th className="px-6 py-3.5">Harga Modal</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {p.game_slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.sku || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatRupiah(p.selling_price)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatRupiah(p.cost_price || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_gangguan ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Gangguan
                        </span>
                      ) : p.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Nonaktif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
