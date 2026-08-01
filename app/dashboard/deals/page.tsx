'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, FileText, ChevronDown, MoreHorizontal, X, Loader2 } from 'lucide-react'
import { formatRupiah, formatDate } from '@/lib/utils'
import { getDeals, createPenjualan } from '@/app/actions/deals'
import { getInventory } from '@/app/actions/inventory'
import { getAccounts } from '@/app/actions/accounts'
import type { Database } from '@/types/database.types'

type Deal = any // Using any for complex join
type InventoryItem = Database['public']['Tables']['inventory']['Row'] & {
  games: { name: string; slug: string } | null
}
type Account = Database['public']['Tables']['accounts']['Row']

export default function DealsPage() {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [stocks, setStocks] = useState<InventoryItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getDeals(),
        getInventory(),
        getAccounts()
      ])
      setDeals(dealsData || [])
      setStocks((stocksResult.data || []).filter(s => s.status === 'AVAILABLE')) // Only available items
      setAccounts(accountsData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDeal = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      setError('')
      await createPenjualan(formData)
      setIsAddDealOpen(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Transaksi (Deals)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola semua transaksi penjualan reguler, booking, dan cicilan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <FileText className="h-4 w-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsAddDealOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Buat Deal Baru
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
            placeholder="Cari nomor deal, customer, atau stok..."
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 w-full sm:w-auto min-w-[140px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Semua Status</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 w-full sm:w-auto min-w-[140px]">
            <span>Pilih Tanggal</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nomor Deal
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stok yang Dijual
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Harga Deal
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Dibayar
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status Deal
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tanggal Deal
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => {
                  let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'
                  if (deal.status === 'Lunas' || deal.status === 'Selesai') {
                    badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  } else if (deal.status === 'Booking' || deal.status === 'Akses Terbatas') {
                    badgeClass = 'bg-orange-50 text-orange-600 border-orange-100'
                  } else if (deal.status?.includes('Cancel')) {
                    badgeClass = 'bg-rose-50 text-rose-600 border-rose-100'
                  }

                  const stockName = deal.deal_items?.[0]?.stocks?.name || 'N/A'

                  return (
                    <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {deal.deal_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {deal.customers?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className="truncate block max-w-[200px]" title={stockName}>{stockName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold text-right">
                        {formatRupiah(Number(deal.total_deal_price))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold ${Number(deal.total_paid) < Number(deal.total_deal_price) ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {formatRupiah(Number(deal.total_paid))}
                          </span>
                          {Number(deal.total_paid) < Number(deal.total_deal_price) && (
                            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Sisa: {formatRupiah(Number(deal.total_deal_price) - Number(deal.total_paid))}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                        {formatDate(deal.created_at)}
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
            Menampilkan <span className="font-semibold text-slate-900">{deals.length > 0 ? 1 : 0}</span> - <span className="font-semibold text-slate-900">{deals.length}</span> dari <span className="font-semibold text-slate-900">{deals.length}</span> transaksi
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 text-slate-400 rounded-md text-sm cursor-not-allowed">Sebelummnya</button>
            <button className="px-3 py-1 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md text-sm font-medium">Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* Buat Deal Baru Modal (Slide-over / Modal) */}
      {isAddDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buat Deal Baru</h2>
                <p className="text-xs text-slate-500 mt-1">Isi form transaksi penjualan atau booking.</p>
              </div>
              <button onClick={() => setIsAddDealOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddDeal} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Stok</label>
                  <select name="stock_id" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Stok Tersedia --</option>
                    {stocks.map(stock => (
                      <option key={stock.id} value={stock.id}>{stock.title_reference}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Customer</label>
                  <input name="customer_name" required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Budi Santoso" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP Customer (Opsional)</label>
                  <input name="customer_phone" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. 08123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga Deal</label>
                  <input name="price" required type="number" min="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" />
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Pembayaran Awal</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nominal Pembayaran (Bisa 0 jika piutang total)</label>
                      <input name="payment_amount" type="number" min="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Rp 0" defaultValue={0} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Metode Pembayaran</label>
                      <select name="account_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="">-- Pilih Rekening (Kosongkan jika 0) --</option>
                        {accounts.filter(a => a.is_active).map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Memproses...' : 'Proses Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

