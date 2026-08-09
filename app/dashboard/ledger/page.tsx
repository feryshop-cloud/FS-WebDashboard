"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  PenTool,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getLedgers, addManualLedger, updateLedger, deleteLedger } from "@/app/actions/ledger";
import { getAccounts } from "@/app/actions/accounts";
import { Pagination } from "@/components/ui/Pagination";
import { LedgerWithRelations } from "@/types/database";
import type { Database } from "@/types/database.types";

type LedgerRecord = LedgerWithRelations;
type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function LedgerPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") || undefined;

  const [ledgers, setLedgers] = useState<LedgerRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Actions & Modals state
  const [editingLedger, setEditingLedger] = useState<LedgerRecord | null>(null);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isAddManualClosing, setIsAddManualClosing] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadLedgerData = () => {
    setIsLoading(true);
    Promise.all([getLedgers(currentPage, itemsPerPage, accountId), getAccounts()])
      .then(([ledgerRes, accountsData]) => {
        setLedgers((ledgerRes.data as LedgerRecord[]) || []);
        setTotalCount(ledgerRes.totalCount || 0);
        setAccounts(accountsData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([getLedgers(currentPage, itemsPerPage, accountId), getAccounts()])
      .then(([ledgerRes, accountsData]) => {
        if (isMounted) {
          setLedgers((ledgerRes.data as LedgerRecord[]) || []);
          setTotalCount(ledgerRes.totalCount || 0);
          setAccounts(accountsData || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, accountId]);

  const closeAddManual = () => {
    if (isAddManualClosing || isSubmitting) return;
    setIsAddManualClosing(true);
    setTimeout(() => {
      setIsAddManualClosing(false);
      setIsAddManualOpen(false);
    }, 200);
  };

  const openAddManual = () => {
    setError("");
    if (isAddManualClosing) return;
    setIsAddManualOpen(true);
  };

  const editLedger = (tx: LedgerRecord) => {
    if (isEditClosing) return;
    setError("");
    setEditingLedger(tx);
  };

  const closeEdit = () => {
    if (isEditClosing || isSubmitting) return;
    setIsEditClosing(true);
    setTimeout(() => {
      setIsEditClosing(false);
      setEditingLedger(null);
    }, 200);
  };

  const handleAddManual = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await addManualLedger(formData);
      loadLedgerData();
      closeAddManual();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingLedger) return;
    try {
      setIsSubmitting(true);
      setError("");
      await updateLedger(editingLedger.id, formData);
      loadLedgerData();
      closeEdit();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tx: LedgerRecord) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus entri kas ini (${tx.notes || tx.id})?`)) return;

    try {
      setIsDeletingId(tx.id);
      setError("");
      await deleteLedger(tx.id);
      loadLedgerData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredLedgers = ledgers.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ref_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const record = item as unknown as Record<string, unknown>;
    const matchesType =
      typeFilter === "ALL" || record.type === typeFilter || record.transaction_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleExportExcel = () => {
    if (filteredLedgers.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const headers = [
      "Tanggal",
      "ID Transaksi",
      "Tipe Transaksi",
      "Rekening",
      "Referensi",
      "Catatan",
      "Nominal (Rp)",
    ];

    const rows = filteredLedgers.map((tx) => [
      formatDate(tx.created_at),
      tx.id,
      tx.transaction_type,
      tx.accounts?.name || "-",
      tx.ref_id || "-",
      `"${(tx.notes || "-").replace(/"/g, '""')}"`,
      tx.amount,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `buku_kas_ledger_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Buku Kas / Ledger</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Catatan riwayat seluruh pergerakan uang masuk, keluar, dan mutasi internal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            <FileText className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={openAddManual}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Catat Kas Manual
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
            placeholder="Cari referensi, catatan, atau ID..."
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="border-border bg-card text-foreground flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium">
            <Filter className="text-faint-foreground h-4 w-4" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-foreground cursor-pointer bg-transparent text-sm font-medium outline-none"
            >
              <option value="ALL">Semua Tipe Kas</option>
              <option value="IN">Uang Masuk (IN)</option>
              <option value="OUT">Uang Keluar (OUT)</option>
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
                  Tanggal & ID
                </th>
                <th scope="col" className="px-6 py-4">
                  Tipe Transaksi
                </th>
                <th scope="col" className="px-6 py-4">
                  Rekening
                </th>
                <th scope="col" className="px-6 py-4">
                  Referensi / Catatan
                </th>
                <th scope="col" className="px-6 py-4 text-right">
                  Nominal
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
              ) : filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-faint-foreground px-6 py-12 text-center text-sm">
                    Tidak ada riwayat mutasi yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((tx) => {
                  const isPositive = Number(tx.amount) >= 0;

                  // Determine Badge styling based on transaction type
                  let typeBadge = "bg-muted text-muted-foreground border-border";
                  let IconType = ArrowUpRight;
                  if ((tx.transaction_type as string) === "Pembayaran Masuk") {
                    typeBadge = "bg-emerald-50 text-emerald-600 border-emerald-100";
                    IconType = ArrowUpRight;
                  } else if ((tx.transaction_type as string) === "Mutasi Masuk") {
                    typeBadge = "bg-blue-50 text-blue-600 border-blue-100";
                    IconType = ArrowRightLeft;
                  } else if ((tx.transaction_type as string) === "Mutasi Keluar") {
                    typeBadge = "bg-rose-50 text-rose-600 border-rose-100";
                    IconType = ArrowDownRight;
                  } else if (
                    (tx.transaction_type as string) === "Penyesuaian" ||
                    (tx.transaction_type as string) === "Refund" ||
                    (tx.transaction_type as string) === "Pengeluaran Operasional" ||
                    (tx.transaction_type as string) === "Pembayaran Pembelian Stok"
                  ) {
                    typeBadge = "bg-amber-50 text-amber-600 border-amber-100";
                    IconType = PenTool;
                  }

                  return (
                    <tr key={tx.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-faint-foreground mb-0.5 text-[11px] font-medium">
                            {formatDate(tx.created_at)}
                          </span>
                          <span
                            className="text-foreground w-24 truncate font-mono text-xs font-semibold"
                            title={tx.id}
                          >
                            {tx.id.split("-")[0]}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${typeBadge}`}
                        >
                          <IconType className="h-3 w-3" />
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="text-foreground px-6 py-4 font-medium whitespace-nowrap">
                        {tx.accounts?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex max-w-[280px] flex-col">
                          <span className="text-foreground truncate font-semibold">
                            {tx.ref_id ? `Ref: ${tx.ref_id}` : "-"}
                          </span>
                          <span className="text-muted-foreground mt-0.5 truncate text-xs">
                            {tx.notes || "-"}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold tracking-tight whitespace-nowrap ${isPositive ? "text-emerald-600" : "text-foreground"}`}
                      >
                        {isPositive ? "+" : ""}
                        {formatRupiah(Number(tx.amount))}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => editLedger(tx)}
                            className="rounded-[10px] p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Edit Catatan"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx)}
                            disabled={isDeletingId === tx.id}
                            className="rounded-[10px] p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                            title="Hapus Entri Kas"
                          >
                            {isDeletingId === tx.id ? (
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalCount || ledgers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="mutasi"
        />
      </div>

      {/* Add Manual Ledger Modal */}
      {(isAddManualOpen || isAddManualClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isAddManualClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeAddManual}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddManualClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Catat Kas Manual</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Tambah entri uang masuk, keluar, atau pengeluaran operasional.
                </p>
              </div>
              <button
                onClick={closeAddManual}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              action={handleAddManual}
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
                    Pilih Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="account_id"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Tipe Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="transaction_type"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="PAYMENT_IN">Uang Masuk (PAYMENT_IN)</option>
                    <option value="PAYMENT_OUT">Uang Keluar (PAYMENT_OUT)</option>
                    <option value="REFUND">Refund (REFUND)</option>
                    <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Misal: 50000"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Catatan / Keterangan
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Misal: Biaya admin bank, bayar listrik server, dsb."
                  />
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeAddManual}
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
                    <span>Simpan Transaksi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ledger Modal */}
      {editingLedger && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isEditClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeEdit}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isEditClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Edit Catatan Transaksi</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Ubah deskripsi atau catatan entri kas ini.
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleUpdate} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    ID Transaksi
                  </label>
                  <p className="border-border bg-muted text-foreground truncate rounded-lg border p-2 font-mono text-xs font-semibold">
                    {editingLedger.id}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Tipe Transaksi & Nominal
                  </label>
                  <p className="text-foreground text-sm font-bold">
                    {editingLedger.transaction_type} ({formatRupiah(Number(editingLedger.amount))})
                  </p>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Catatan / Keterangan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="notes"
                    required
                    rows={4}
                    defaultValue={editingLedger.notes || ""}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Catatan transaksi..."
                  />
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeEdit}
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
                    <span>Update Catatan</span>
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
