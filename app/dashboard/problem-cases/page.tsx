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
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ProblemCaseWithRelations | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
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

  const openAdd = () => {
    setError("");
    if (isAddClosing) return;
    setIsAddOpen(true);
  };

  const closeAdd = () => {
    if (isAddClosing || isSubmitting) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const handleOpenDetail = (c: ProblemCaseWithRelations) => {
    if (isDetailClosing) return;
    setError("");
    setSelectedCase(c);
    setEditStatus((c.status as string) || "OPEN");
    setEditChronology((c.chronology as string) || "");
    setEditIssueType((c.issue_type as string) || "");
  };

  const closeDetail = () => {
    if (isDetailClosing || isSubmitting) return;
    setIsDetailClosing(true);
    setTimeout(() => {
      setIsDetailClosing(false);
      setSelectedCase(null);
    }, 200);
  };

  const handleAddCase = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createProblemCase(formData);
      loadData();
      closeAdd();
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
      loadData();
      closeDetail();
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
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Akun Bermasalah (Problem Cases)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola tiket masalah untuk stok akun maupun komplain transaksi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Buat Case Baru
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border bg-muted/70 text-foreground focus:bg-card block w-full rounded-xl border py-2 pr-3 pl-10 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            placeholder="Cari ID case, tipe masalah, atau customer..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="border-border bg-card text-foreground flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium">
            <Filter className="text-faint-foreground h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-foreground cursor-pointer bg-transparent text-sm font-medium outline-none"
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
      <div className="border-border-soft bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border-soft min-w-full divide-y text-left text-sm">
            <thead className="bg-muted/80 text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
            <tbody className="divide-border-soft bg-card text-muted-foreground divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-faint-foreground px-6 py-12 text-center text-sm">
                    Belum ada tiket masalah yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  let badgeClass = "bg-muted text-muted-foreground border-border";
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
                    <tr key={c.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="text-foreground px-6 py-4 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {c.status === "OPEN" && (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          )}
                          {c.case_number}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-6 py-4 whitespace-nowrap">
                        {formatDate(c.created_at ?? "")}
                      </td>
                      <td className="text-foreground px-6 py-4 font-medium">
                        {c.issue_type as string}
                      </td>
                      <td className="text-muted-foreground px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{relatedStr}</span>
                          {c.customers && (
                            <span className="text-faint-foreground mt-0.5 text-xs">
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
      {(isAddOpen || isAddClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isAddClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeAdd}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Buat Case Baru</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Catat masalah untuk ditindaklanjuti.
                </p>
              </div>
              <button
                onClick={closeAdd}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              action={handleAddCase}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Tipe Masalah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="issue_type"
                    required
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Mis. Kena Hackback, Password Salah"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Terkait Dengan
                  </label>
                  <select
                    name="related_type"
                    value={relatedType}
                    onChange={(e) => setRelatedType(e.target.value)}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="NONE">-- Tidak Ada --</option>
                    <option value="DEAL">Transaksi (Deal)</option>
                    <option value="STOCK">Stok Inventori</option>
                  </select>
                </div>

                {relatedType === "DEAL" && (
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      Pilih Deal
                    </label>
                    <select
                      name="related_id"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      Pilih Stok
                    </label>
                    <select
                      name="related_id"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Kronologi / Catatan
                  </label>
                  <textarea
                    name="chronology"
                    rows={4}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Tuliskan kronologi kejadian secara detail..."
                  ></textarea>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Status Awal
                  </label>
                  <select
                    name="status"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="OPEN">Open (Baru)</option>
                    <option value="IN_PROGRESS">Ditindaklanjuti</option>
                  </select>
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="text-muted-foreground hover:bg-muted rounded-lg px-4 py-2 text-xs font-semibold"
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
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isDetailClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isDetailClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">
                  Detail & Status Case ({selectedCase.case_number})
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Tanggal: {formatDate(selectedCase.created_at ?? "")}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={handleUpdateCase}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Tipe Masalah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editIssueType}
                    onChange={(e) => setEditIssueType(e.target.value)}
                    className="border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Status Case Terkini <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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

                <div className="border-border-soft bg-muted/70 space-y-1 rounded-xl border p-3">
                  <p className="text-faint-foreground text-[10px] font-semibold tracking-wider uppercase">
                    Objek Terkait
                  </p>
                  <p className="text-foreground text-xs font-bold">
                    {selectedCase.deals
                      ? `Deal: ${selectedCase.deals.deal_number}`
                      : selectedCase.stocks
                        ? `Stock: ${selectedCase.stocks.sku || ""} (${selectedCase.stocks.name})`
                        : "Tidak Ada"}
                  </p>
                  {selectedCase.customers && (
                    <p className="text-muted-foreground text-xs">
                      Customer: {selectedCase.customers.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Kronologi & Catatan Penanganan
                  </label>
                  <textarea
                    rows={5}
                    value={editChronology}
                    onChange={(e) => setEditChronology(e.target.value)}
                    className="border-border text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Catatan penanganan case..."
                  />
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeDetail}
                  className="text-muted-foreground hover:bg-muted rounded-lg px-4 py-2 text-xs font-semibold"
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
