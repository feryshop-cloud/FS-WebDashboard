"use client";

import React, { Suspense } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  PenTool,
  Loader2,
  Plus,
  FileText,
  Trash2,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { IconButton } from "@/components/ui/IconButton";
import { useLedger, type LedgerRecord } from "@/lib/hooks/features/useLedger";

function LedgerPageContent() {
  const {
    data: { ledgers, accounts, filteredLedgers, totalCount },
    isLoading,
    isSubmitting,
    isDeletingId,
    error,
    uiState: {
      searchTerm,
      typeFilter,
      currentPage,
      itemsPerPage,
      editingLedger,
      isAddManualOpen,
      isAddManualClosing,
      isEditClosing,
    },
    refs: { addManualRef, editRef },
    actions: {
      setSearchTerm,
      setTypeFilter,
      setCurrentPage,
      handlePageSizeChange,
      openAddManual,
      closeAddManual,
      editLedger,
      closeEdit,
      handleAddManual,
      handleUpdate,
      handleDelete,
      handleExportExcel,
    },
  } = useLedger();

  const columns: DataTableColumn<LedgerRecord>[] = [
    {
      key: "date",
      header: "Tanggal & ID",
      render: (tx) => (
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
      ),
    },
    {
      key: "type",
      header: "Tipe Transaksi",
      render: (tx) => (
        <StatusBadge
          label={tx.transaction_type}
          tone={txTypeTone(tx.transaction_type)}
          icon={txTypeIcon(tx.transaction_type)}
        />
      ),
    },
    {
      key: "account",
      header: "Rekening",
      className: "text-foreground font-medium whitespace-nowrap",
      render: (tx) => <span className="text-foreground">{tx.accounts?.name || "-"}</span>,
    },
    {
      key: "ref",
      header: "Referensi / Catatan",
      render: (tx) => (
        <div className="flex max-w-70 flex-col">
          <span
            className="text-foreground truncate font-semibold"
            title={tx.ref_id ? `Ref: ${tx.ref_id}` : "-"}
          >
            {tx.ref_id ? `Ref: ${tx.ref_id}` : "-"}
          </span>
          <span className="text-muted-foreground mt-0.5 truncate text-xs" title={tx.notes || "-"}>
            {tx.notes || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      align: "right",
      className: "font-bold tracking-tight whitespace-nowrap",
      render: (tx) => (
        <span className={Number(tx.amount) >= 0 ? "text-emerald-600" : "text-foreground"}>
          {Number(tx.amount) >= 0 ? "+" : ""}
          {formatRupiah(Number(tx.amount))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "center",
      render: (tx) => (
        <div className="flex items-center justify-center gap-2">
          <IconButton
            icon={PenTool}
            onClick={() => editLedger(tx)}
            title="Edit Catatan"
            tone="blue"
            size={14}
          />
          <IconButton
            icon={Trash2}
            onClick={() => handleDelete(tx)}
            isLoading={isDeletingId === tx.id}
            disabled={isDeletingId === tx.id}
            title="Hapus Entri Kas"
            ariaLabel="Hapus Entri Kas"
            tone="rose"
            size={14}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Buku Kas / Ledger"
        subtitle="Catatan riwayat seluruh pergerakan uang masuk, keluar, dan mutasi internal."
        actions={
          <>
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
          </>
        }
      />

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari referensi, catatan, atau ID..."
        />
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            ariaLabel="Filter tipe kas"
            options={[
              { value: "ALL", label: "Semua Tipe Kas" },
              { value: "IN", label: "Uang Masuk (IN)" },
              { value: "OUT", label: "Uang Keluar (OUT)" },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filteredLedgers}
        rowKey={(tx) => tx.id}
        isLoading={isLoading}
        emptyMessage="Tidak ada riwayat mutasi yang cocok dengan pencarian/filter."
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount || ledgers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="mutasi"
          />
        }
      />

      {/* Add Manual Ledger Modal */}
      {(isAddManualOpen || isAddManualClosing) && (
        <SlideOverDrawer
          open={isAddManualOpen}
          closing={isAddManualClosing}
          onClose={closeAddManual}
          title="Catat Kas Manual"
          subtitle="Tambah entri uang masuk, keluar, atau pengeluaran operasional."
          labelledById="add-ledger-title"
          drawerRef={addManualRef as React.Ref<HTMLDivElement>}
          headerClassName="bg-muted/50"
          closeButtonClassName="rounded-lg hover:bg-muted"
        >
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
        </SlideOverDrawer>
      )}

      {/* Edit Ledger Modal */}
      {editingLedger && (
        <SlideOverDrawer
          open={!!editingLedger}
          closing={isEditClosing}
          onClose={closeEdit}
          title="Edit Catatan Transaksi"
          subtitle="Ubah deskripsi atau catatan entri kas ini."
          labelledById="edit-ledger-title"
          drawerRef={editRef as React.Ref<HTMLDivElement>}
          headerClassName="bg-muted/50"
          closeButtonClassName="rounded-lg hover:bg-muted"
        >
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
                <p
                  className="border-border bg-muted text-foreground truncate rounded-lg border p-2 font-mono text-xs font-semibold"
                  title={editingLedger.id}
                >
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
        </SlideOverDrawer>
      )}
    </>
  );
}

function txTypeTone(type: string): BadgeTone {
  switch (type) {
    case "Pembayaran Masuk":
      return "emerald";
    case "Mutasi Masuk":
      return "blue";
    case "Mutasi Keluar":
      return "rose";
    default:
      return "amber";
  }
}

function txTypeIcon(type: string) {
  if (type === "Pembayaran Masuk") return ArrowUpRight;
  if (type === "Mutasi Masuk") return ArrowRightLeft;
  if (type === "Mutasi Keluar") return ArrowDownRight;
  return PenTool;
}

export default function LedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LedgerPageContent />
    </Suspense>
  );
}
