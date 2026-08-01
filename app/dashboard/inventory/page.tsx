'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, ChevronDown, MoreHorizontal, Download, X, Loader2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { getInventory, addInventoryItem, getGames } from '@/app/actions/inventory'
import type { Database } from '@/types/database.types'

type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  games: { name: string; slug: string } | null
}
type Game = { id: string; name: string; slug: string }

export default function InventoryPage() {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')

  useEffect(() => {
    loadInventory()
    loadGames()
  }, [])

  const loadInventory = async () => {
    try {
      setIsLoading(true)
      const result = await getInventory()
      if (result.error) {
        console.error('Error loading inventory:', result.error)
      } else {
        setInventory(result.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGames = async () => {
    try {
      const result = await getGames()
      if (!result.error && result.data) {
        setGames(result.data)
      }
    } catch (err) {
      console.error('Error loading games:', err)
    }
  }

  const handleAddStock = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      setError('')
      const result = await addInventoryItem(formData)
      if (result.success) {
        setIsAddStockOpen(false)
        loadInventory()
      } else {
        setError(result.error || 'Gagal menambah stok.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredInventory = activeCategory === 'Semua'
    ? inventory
    : inventory.filter(item => item.games?.name === activeCategory)

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Stok</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola seluruh stok akun game, harga modal, dan status ketersediaan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={() => setIsAddStockOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah Stok
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 placeholder-slate-400 bg-slate-50 outline-none transition-all"
            placeholder="Cari ID stok, kategori, atau nama akun..."
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 w-full sm:w-auto min-w-[140px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>{activeCategory}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 w-full sm:w-auto min-w-[140px]">
            <span>Semua Status</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('Semua')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
            activeCategory === 'Semua'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveCategory(game.name)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeCategory === game.name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ID Stok
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Kategori Game
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nama / Kode Stok
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Harga Modal
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Harga Jual
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status Stok
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Belum ada data stok.
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Tidak ada stok untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'
                  const statusStr = item.status || 'UNPOSTED'

                  if (statusStr === 'AVAILABLE') {
                    badgeClass = 'bg-blue-50 text-blue-600 border-blue-100'
                  } else if (statusStr === 'SOLD') {
                    badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  } else if (statusStr === 'UNPOSTED') {
                    badgeClass = 'bg-orange-50 text-orange-600 border-orange-100'
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {item.title_reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-600">
                          {item.games?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="block truncate max-w-[250px] font-medium">{item.title_reference || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium text-right">
                        {formatRupiah(Number(item.capital_price))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900">{formatRupiah(Number(item.asking_price))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {statusStr}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 relative group/btn">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Mockup */}
        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold text-slate-900">{filteredInventory.length > 0 ? 1 : 0}</span> - <span className="font-semibold text-slate-900">{filteredInventory.length}</span> dari <span className="font-semibold text-slate-900">{filteredInventory.length}</span> stok
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 text-slate-400 rounded-md text-sm cursor-not-allowed">Sebelumnya</button>
            <button className="px-3 py-1 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-medium">Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* Tambah Stok Modal (Slide-over Drawer) */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tambah Stok Baru</h2>
                <p className="text-xs text-slate-500 mt-1">Isi form data stok akun game baru.</p>
              </div>
              <button
                onClick={() => setIsAddStockOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={handleAddStock} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Game</label>
                  <select name="game_id" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">Pilih Kategori Game...</option>
                    {games.map(game => (
                      <option key={game.id} value={game.id}>{game.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kode Referensi</label>
                  <input
                    name="title_reference"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. ML-MYTHIC-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Spesifikasi Akun</label>
                  <textarea
                    name="account_specs"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Details like rank, skins, win rate..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Modal</label>
                    <input
                      name="capital_price"
                      required
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Rp 0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Jual</label>
                    <input
                      name="asking_price"
                      required
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
  )
}