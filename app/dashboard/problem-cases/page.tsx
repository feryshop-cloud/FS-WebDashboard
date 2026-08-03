"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  MoreHorizontal,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getProblemCases, createProblemCase } from "@/app/actions/problem-cases";
import { getDeals } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import {
  ProblemCaseWithRelations,
  DealWithRelations,
  InventoryItemWithGame,
} from "@/types/database";

export default function ProblemCasesPage() {
  const [cases, setCases] = useState<ProblemCaseWithRelations[]>([]);
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [stocks, setStocks] = useState<InventoryItemWithGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [relatedType, setRelatedType] = useState("NONE");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [casesData, dealsData, stocksResult] = await Promise.all([
        getProblemCases(),
        getDeals(),
        getInventory(),
      ]);
      setCases(casesData || []);
      setDeals((dealsData as unknown as DealWithRelations[]) || []);
      setStocks(stocksResult.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAddCase = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createProblemCase(formData);
      setIsAddOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Akun Bermasalah (Problem Cases)
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola tiket masalah untuk stok akun maupun komplain transaksi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Case Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-10 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari ID case, ID stok, atau customer..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button className="inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Semua Status</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Nomor Case
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Tanggal Laporan
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Tipe Masalah
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Stok / Deal Terkait
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Status Case
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
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
                  let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                  if (c.status === "Open") badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                  if (c.status === "Ditindaklanjuti")
                    badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                  if (c.status?.includes("Menunggu"))
                    badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
                  if (c.status === "Selesai")
                    badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  if (c.status === "Refund")
                    badgeClass = "bg-slate-800 text-white border-slate-700";

                  const relatedStr = c.deals
                    ? `Deal: ${c.deals.deal_number}`
                    : c.stocks
                      ? `Stock: ${c.stocks.sku} (${c.stocks.name})`
                      : "-";

                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-slate-900">
                        <div className="flex items-center gap-2">
                          {c.status === "Open" && (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          )}
                          {c.case_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-500">
                         {formatDate(c.created_at ?? "")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                         {c.issue_type as string}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{relatedStr}</span>
                          {c.customers && (
                            <span className="mt-0.5 text-xs">Cust: {c.customers.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <button className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buat Case Baru Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buat Case Baru</h2>
                <p className="mt-1 text-xs text-slate-500">Catat masalah untuk ditindaklanjuti.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddCase} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipe Masalah
                  </label>
                  <input
                    name="issue_type"
                    required
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. Kena Hackback, Password Salah"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Terkait Dengan
                  </label>
                  <select
                    name="related_type"
                    value={relatedType}
                    onChange={(e) => setRelatedType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="NONE">-- Tidak Ada --</option>
                    <option value="DEAL">Transaksi (Deal)</option>
                    <option value="STOCK">Stok Inventori</option>
                  </select>
                </div>

                {relatedType === "DEAL" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Pilih Deal
                    </label>
                    <select
                      name="related_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.deal_number} - {d.customers?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {relatedType === "STOCK" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Pilih Stok
                    </label>
                    <select
                      name="related_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {stocks.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sku} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Kronologi / Catatan
                  </label>
                  <textarea
                    name="chronology"
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Tuliskan kronologi kejadian secara detail..."
                  ></textarea>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status Awal
                  </label>
                  <select
                    name="status"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Open">Open (Baru)</option>
                    <option value="Ditindaklanjuti">Ditindaklanjuti</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Simpan Case Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
