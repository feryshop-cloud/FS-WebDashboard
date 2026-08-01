'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Filter, ChevronDown, MoreHorizontal, AlertTriangle, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getProblemCases, createProblemCase } from '@/app/actions/problem-cases'
import { getDeals } from '@/app/actions/deals'
import { getInventory } from '@/app/actions/inventory'

export default function ProblemCasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [relatedType, setRelatedType] = useState('NONE')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [casesData, dealsData, stocksResult] = await Promise.all([
        getProblemCases(),
        getDeals(),
        getInventory()
      ])
      setCases(casesData || [])
      setDeals(dealsData || [])
      setStocks(stocksResult.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCase = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      setError('')
      await createProblemCase(formData)
      setIsAddOpen(false)
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Akun Bermasalah (Problem Cases)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola tiket masalah untuk stok akun maupun komplain transaksi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Buat Case Baru
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
            placeholder="Cari ID case, ID stok, atau customer..."
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nomor Case
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tanggal Laporan
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tipe Masalah
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stok / Deal Terkait
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status Case
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Belum ada case bermasalah.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200'
                  if (c.status === 'Open') badgeClass = 'bg-rose-50 text-rose-600 border-rose-100'
                  if (c.status === 'Ditindaklanjuti') badgeClass = 'bg-blue-50 text-blue-600 border-blue-100'
                  if (c.status?.includes('Menunggu')) badgeClass = 'bg-orange-50 text-orange-600 border-orange-100'
                  if (c.status === 'Selesai') badgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  if (c.status === 'Refund') badgeClass = 'bg-slate-800 text-white border-slate-700'

                  const relatedStr = c.deals ? `Deal: ${c.deals.deal_number}` : c.stocks ? `Stock: ${c.stocks.sku} (${c.stocks.name})` : '-'

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {c.status === 'Open' && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                          {c.case_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {c.issue_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{relatedStr}</span>
                          {c.customers && <span className="text-xs mt-0.5">Cust: {c.customers.name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50">
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
      </div>

      {/* Buat Case Baru Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buat Case Baru</h2>
                <p className="text-xs text-slate-500 mt-1">Catat masalah untuk ditindaklanjuti.</p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddCase} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Masalah</label>
                  <input name="issue_type" required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mis. Kena Hackback, Password Salah" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Terkait Dengan</label>
                  <select name="related_type" value={relatedType} onChange={(e) => setRelatedType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="NONE">-- Tidak Ada --</option>
                    <option value="DEAL">Transaksi (Deal)</option>
                    <option value="STOCK">Stok Inventori</option>
                  </select>
                </div>

                {relatedType === 'DEAL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Deal</label>
                    <select name="related_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {deals.map(d => <option key={d.id} value={d.id}>{d.deal_number} - {d.customers?.name}</option>)}
                    </select>
                  </div>
                )}

                {relatedType === 'STOCK' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Stok</label>
                    <select name="related_id" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {stocks.map(s => <option key={s.id} value={s.id}>{s.sku} - {s.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kronologi / Catatan</label>
                  <textarea name="chronology" rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tuliskan kronologi kejadian secara detail..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Awal</label>
                  <select name="status" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Open">Open (Baru)</option>
                    <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                  </select>
                </div>

              </div>
              <div className="p-6 border-t border-slate-100 bg-white">
                <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Memproses...' : 'Simpan Case Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

