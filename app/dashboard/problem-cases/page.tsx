"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, AlertTriangle, X, Loader2, Trash2, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import {
  getProblemCases,
  createProblemCase,
  updateProblemCase,
  deleteProblemCase,
} from "@/app/actions/problem-cases";
import { getDeals } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import {
  ProblemCaseWithRelations,
  DealWithRelations,
  InventoryItemWithGame,
} from "@/types/database";

const PROBLEM_CASE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Ditindaklanjuti",
  WAITING_CUSTOMER: "Menunggu Customer",
  WAITING_THIRD_PARTY: "Menunggu Pihak Ketiga",
  RESOLVED: "Selesai",
  CANNOT_RESOLVE: "Tidak Bisa Diselesaikan",
  PERMANENT: "Permanen",
  REFUND: "Refund",
  CANCEL: "Cancel",
};

export default function ProblemCasesPage() {
  const [cases, setCases] = useState<ProblemCaseWithRelations[]>([]);
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [stocks, setStocks] = useState<InventoryItemWithGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ProblemCaseWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [relatedType, setRelatedType] = useState("NONE");

  // Edit / Detail form state
  const [editStatus, setEditStatus] = useState("");
  const [editChronology, setEditChronology] = useState("");
  const [editIssueType, setEditIssueType] = useState("");

  const loadData = () => {
    setIsLoading(true);
    Promise.all([getProblemCases(), getDeals(), getInventory()])
      .then(([casesData, dealsData, stocksResult]) => {
        setCases(casesData || []);
        setDeals((dealsData as unknown as DealWithRelations[]) || []);
        setStocks(stocksResult.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([getProblemCases(), getDeals(), getInventory()])
      .then(([casesData, dealsData, stocksResult]) => {
        if (isMounted) {
          setCases(casesData || []);
          setDeals((dealsData as unknown as DealWithRelations[]) || []);
          setStocks(stocksResult.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenDetail = (c: ProblemCaseWithRelations) => {
    setError("");
    setSelectedCase(c);
    setEditStatus((c.status as string) || "OPEN");
    setEditChronology((c.chronology as string) || "");
    setEditIssueType((c.issue_type as string) || "");
  };

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

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      setError("");
      await updateProblemCase(selectedCase.id, {
        status: editStatus,
        chronology: editChronology,
        issue_type: editIssueType,
      });
      setSelectedCase(null);
      loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (id: string, caseNumber?: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus problem case "${caseNumber || ""}"?`)) {
      return;
    }
    try {
      setIsDeletingId(id);
      await deleteProblemCase(id);
      loadData();
    } catch (err: unknown) {
      alert("Gagal menghapus problem case: " + getErrorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    const issueTypeStr = String(c.issue_type || "");
    const chronologyStr = String(c.chronology || "");
    const matchesSearch =
      !searchTerm ||
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issueTypeStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chronologyStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            onClick={() => {
              setError("");
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Case Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pr-3 pl-10 text-slate-900 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            placeholder="Cari ID case, tipe masalah, atau customer..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Open (Baru)</option>
              <option value="IN_PROGRESS">Ditindaklanjuti</option>
              <option value="WAITING_CUSTOMER">Menunggu Customer</option>
              <option value="RESOLVED">Selesai</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-6 py-4">
                  Nomor Case
                </th>
                <th scope="col" className="px-6 py-4">
                  Tanggal Laporan
                </th>
                <th scope="col" className="px-6 py-4">
                  Tipe Masalah
                </th>
                <th scope="col" className="px-6 py-4">
                  Stok / Deal Terkait
                </th>
                <th scope="col" className="px-6 py-4 text-center">
                  Status Case
                </th>
                <th scope="col" className="px-6 py-4 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Belum ada tiket masalah yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                  if (c.status === "OPEN") badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                  if (c.status === "IN_PROGRESS")
                    badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                  if (c.status === "WAITING_CUSTOMER" || c.status === "WAITING_THIRD_PARTY")
                    badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
                  if (c.status === "RESOLVED")
                    badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                  if (c.status === "REFUND")
                    badgeClass = "bg-slate-800 text-white border-slate-700";

                  const relatedStr = c.deals
                    ? `Deal: ${c.deals.deal_number}`
                    : c.stocks
                      ? `Stock: ${c.stocks.sku || ""} (${c.stocks.name})`
                      : "-";

                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold whitespace-nowrap text-slate-900">
                        <div className="flex items-center gap-2">
                          {c.status === "OPEN" && (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          )}
                          {c.case_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(c.created_at ?? "")}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {c.issue_type as string}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{relatedStr}</span>
                          {c.customers && (
                            <span className="mt-0.5 text-xs text-slate-400">
                              Cust: {c.customers.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}
                        >
                          {PROBLEM_CASE_STATUS_LABEL[c.status ?? ""] ?? c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(c)}
                            className="rounded-[10px] p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Lihat Detail & Update Status"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCase(c.id, c.case_number)}
                            disabled={isDeletingId === c.id}
                            className="rounded-[10px] p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                            title="Hapus Case"
                          >
                            {isDeletingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Buat Case Baru</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Catat masalah untuk ditindaklanjuti.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddCase} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Tipe Masalah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="issue_type"
                    required
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Mis. Kena Hackback, Password Salah"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Terkait Dengan
                  </label>
                  <select
                    name="related_type"
                    value={relatedType}
                    onChange={(e) => setRelatedType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="NONE">-- Tidak Ada --</option>
                    <option value="DEAL">Transaksi (Deal)</option>
                    <option value="STOCK">Stok Inventori</option>
                  </select>
                </div>

                {relatedType === "DEAL" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Pilih Deal
                    </label>
                    <select
                      name="related_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.deal_number} - {d.customers?.name || "Customer"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {relatedType === "STOCK" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Pilih Stok
                    </label>
                    <select
                      name="related_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      {stocks.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sku || "STOK"} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Kronologi / Catatan
                  </label>
                  <textarea
                    name="chronology"
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Tuliskan kronologi kejadian secara detail..."
                  ></textarea>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Status Awal
                  </label>
                  <select
                    name="status"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="OPEN">Open (Baru)</option>
                    <option value="IN_PROGRESS">Ditindaklanjuti</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Simpan Case Baru</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & Update Status Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Detail & Status Case ({selectedCase.case_number})
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tanggal: {formatDate(selectedCase.created_at ?? "")}
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCase} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Tipe Masalah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editIssueType}
                    onChange={(e) => setEditIssueType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Status Case Terkini <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="OPEN">Open (Baru)</option>
                    <option value="IN_PROGRESS">Ditindaklanjuti (In Progress)</option>
                    <option value="WAITING_CUSTOMER">Menunggu Customer</option>
                    <option value="WAITING_THIRD_PARTY">Menunggu Pihak Ketiga</option>
                    <option value="RESOLVED">Selesai (Resolved)</option>
                    <option value="CANNOT_RESOLVE">Tidak Bisa Diselesaikan</option>
                    <option value="REFUND">Refund / Kompensasi</option>
                    <option value="CANCEL">Dibatalkan</option>
                  </select>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Objek Terkait
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedCase.deals
                      ? `Deal: ${selectedCase.deals.deal_number}`
                      : selectedCase.stocks
                        ? `Stock: ${selectedCase.stocks.sku || ""} (${selectedCase.stocks.name})`
                        : "Tidak Ada"}
                  </p>
                  {selectedCase.customers && (
                    <p className="text-xs text-slate-500">
                      Customer: {selectedCase.customers.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Kronologi & Catatan Penanganan
                  </label>
                  <textarea
                    rows={5}
                    value={editChronology}
                    onChange={(e) => setEditChronology(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Catatan penanganan case..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Update Status Case</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
