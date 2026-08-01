'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, ArrowRightLeft, MoreHorizontal, Download, X, Loader2 } from 'lucide-react'
import { formatRupiah, formatDate } from '@/lib/utils'
import { getTradeInDeals, createTukarTambah } from '@/app/actions/trade-in'
import { getInventory } from '@/app/actions/inventory'
import { getAccounts } from '@/app/actions/accounts'
import type { Database } from '@/types/database.types'

type Deal = any
type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  games: { name: string; slug: string } | null
}
type Account = Database['public']['Tables']['accounts']['Row']

export default function TradeInPage() {
  const [isAddTTOpen, setIsAddTTOpen] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [stocks, setStocks] = useState<InventoryItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form states for dynamic cash calc
  const [priceOut, setPriceOut] = useState(0)
  const [ttValue, setTtValue] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getTradeInDeals(),
        getInventory(),
        getAccounts()
      ])
      setDeals(dealsData || [])
      setStocks((stocksResult.data || []).filter(s => s.status === 'AVAILABLE'))
      setAccounts(accountsData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTT = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      setError('')
      await createTukarTambah(formData)
      setIsAddTTOpen(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selisih = ttValue - priceOut

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tukar Tambah (Trade-In)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola transaksi pertukaran aset (akun customer) dengan stok Feryshop.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button 
            onClick={() => setIsAddTTOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Buat Transaksi TT
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
            placeholder="Cari ID transaksi, nama customer..."
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 w-full sm:w-auto min-w-[140px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Filter Status</span>
            </div>
          </button>
        </div>
      </div>

      {/* Cards/Table View for Complex TT Relationships */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-12 text-center text-sm text-slate-500">
            Belum ada transaksi Tukar Tambah.
          </div>
        ) : (
          deals.map((tt) => {
            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'
            if (tt.status === 'Selesai' || tt.status === 'Lunas') badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100'
            if (tt.status === 'Booking') badgeClass = 'bg-orange-50 text-orange-600 border-orange-100'
            if (tt.status?.includes('Cancel')) badgeClass = 'bg-rose-50 text-rose-600 border-rose-100'

            const stockOutName = tt.deal_items?.[0]?.stocks?.name || 'N/A'
            const inItems = tt.trade_in_items || []
            
            // To figure out if it was cash added or cashback, we check total_paid vs price_out
            // Assuming simplified view for now based on total_paid
            const diff = Number(tt.total_paid) - Number(tt.total_deal_price)

            return (
              <div key={tt.id} className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative">
                <div className="absolute top-4 right-4">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-slate-50/50 bg-slate-50/30 flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold text-slate-900">{tt.deal_number}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {tt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{tt.customers?.name || '-'} • {formatDate(tt.created_at)}</p>
                  </div>
                </div>

                {/* TT Content */}
                <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* INWARD (Customer Aset Masuk) */}
                  <div className="col-span-1 lg:col-span-4 flex flex-col gap-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aset Customer (Masuk)</h3>
                    <div className="space-y-2">
                      {inItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                          <span className="text-xs font-semibold text-slate-700 truncate mr-2" title={item.description}>{item.description}</span>
                          <span className="text-xs font-bold text-emerald-600">{formatRupiah(Number(item.estimated_value))}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ARROW SEPARATOR */}
                  <div className="col-span-1 lg:col-span-1 flex justify-center hidden lg:flex">
                    <ArrowRightLeft className="h-6 w-6 text-slate-300" />
                  </div>

                  {/* OUTWARD (Stok Feryshop Keluar) */}
                  <div className="col-span-1 lg:col-span-4 flex flex-col gap-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok Feryshop (Keluar)</h3>
                    <div className="flex justify-between items-center bg-blue-50/50 border border-blue-100 p-2.5 rounded-lg">
                      <span className="text-xs font-semibold text-slate-700 truncate mr-2" title={stockOutName}>{stockOutName}</span>
                      <span className="text-xs font-bold text-slate-900">{formatRupiah(Number(tt.total_deal_price))}</span>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className="col-span-1 lg:col-span-3 flex flex-col items-end lg:border-l lg:border-slate-100 lg:pl-6 justify-center h-full pt-4 lg:pt-0 border-t border-slate-100 mt-4 lg:mt-0">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Nilai Transaksi Feryshop</span>
                    <span className="text-xl font-bold text-slate-900 tracking-tight mt-1">{formatRupiah(Number(tt.total_deal_price))}</span>
                    
                    <button className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md w-full sm:w-auto text-center">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {deals.length > 0 && (
        <div className="flex justify-center mt-4">
          <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
            Muat Lebih Banyak
          </button>
        </div>
      )}

      {/* Buat TT Baru Modal */}
      {isAddTTOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Transaksi Tukar Tambah</h2>
                <p className="text-xs text-slate-500 mt-1">Isi detail aset masuk dan keluar.</p>
              </div>
              <button onClick={() => setIsAddTTOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddTT} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
                
                {/* Customer Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Customer</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Customer</label>
                    <input name="customer_name" required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Budi Santoso" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. HP Customer (Opsional)</label>
                    <input name="customer_phone" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. 08123456789" />
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Feryshop Out Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-blue-600">Stok Keluar (Feryshop)</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Stok</label>
                    <select name="stock_out_id" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih Stok Tersedia --</option>
                      {stocks.map(stock => (
                        <option key={stock.id} value={stock.id}>{stock.title_reference}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Deal (Nilai Stok Keluar)</label>
                    <input name="price_out" required type="number" min="1" value={priceOut || ''} onChange={e => setPriceOut(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" />
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Customer In Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Aset Masuk (Dari Customer)</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Aset TT</label>
                    <input name="tt_desc" required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Akun MLBB Mythic" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Nilai Aset Masuk</label>
                    <input name="tt_value" required type="number" min="1" value={ttValue || ''} onChange={e => setTtValue(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" />
                  </div>
                </div>

                {/* Selisih & Payment Calculation */}
                {(priceOut > 0 || ttValue > 0) && (
                  <div className={`p-4 rounded-xl border ${selisih < 0 ? 'bg-emerald-50 border-emerald-100' : selisih > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Selisih Transaksi</h3>
                    <div className="text-xs text-slate-600 mb-3">
                      {selisih < 0 ? (
                        <span>Customer <strong className="text-emerald-700">tambah uang</strong> sebesar:</span>
                      ) : selisih > 0 ? (
                        <span>Feryshop <strong className="text-rose-700">bayar cashback</strong> sebesar:</span>
                      ) : (
                        <span>Tukar guling (tanpa tambah/cashback).</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-slate-900 mb-4">
                      {formatRupiah(Math.abs(selisih))}
                    </div>

                    <div className="space-y-3">
                      <input type="hidden" name="payment_direction" value={selisih < 0 ? 'IN' : 'OUT'} />
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Uang Tunai yang Dibayarkan</label>
                        <input name="payment_amount" type="number" min="0" defaultValue={Math.abs(selisih)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Rp 0" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Pilih Rekening Transaksi</label>
                        <select name="account_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                          <option value="">-- Rekening (Wajib jika ada tunai) --</option>
                          {accounts.filter(a => a.is_active).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Memproses...' : 'Proses Tukar Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
