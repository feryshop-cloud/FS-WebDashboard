"use client";

import React, { useMemo } from "react";
import { Plus, Search, Trash2, Edit, X, Save, Loader2, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { usePromoCodes, type PromoCodeRow } from "@/lib/hooks/features/usePromoCodes";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

export default function PromoCodesPage() {
  const {
    data: { filtered, pageItems, safePage, itemsPerPage, sortKey, sortDir },
    isLoading,
    isSubmitting,
    error,
    uiState: { search, isAddOpen, isAddClosing, editing, form },
    actions: {
      setSearch,
      setField,
      openAdd,
      openEdit,
      closeModal,
      handleSave,
      handleDelete,
      setCurrentPage,
      setItemsPerPage,
      handleSort,
    },
  } = usePromoCodes();

  const discountLabel = (p: PromoCodeRow) =>
    p.discount_type === "percent"
      ? `${Number(p.discount_value)}%`
      : formatRupiah(Math.floor(Number(p.discount_value)));

  const columns = useMemo<DataTableColumn<PromoCodeRow>[]>(
    () => [
      {
        key: "code",
        header: "Kode",
        sortable: true,
        className: "px-5 py-3 font-bold text-blue-600",
        render: (p) => p.code,
      },
      {
        key: "discount",
        header: "Diskon",
        sortable: true,
        className: "px-4 py-3",
        render: (p) => discountLabel(p),
      },
      {
        key: "min_order",
        header: "Min Order",
        sortable: true,
        className: "px-4 py-3",
        render: (p) => formatRupiah(Number(p.min_order || 0)),
      },
      {
        key: "quota",
        header: "Kuota (Terpakai)",
        sortable: true,
        className: "px-4 py-3",
        render: (p) => {
          const quota = p.quota ?? 0;
          const used = p.used_count ?? 0;
          const full = quota > 0 && used >= quota;
          return (
            <>
              {used} / {quota === 0 ? "∞" : quota}
              {full && (
                <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                  Habis
                </span>
              )}
            </>
          );
        },
      },
      {
        key: "period",
        header: "Periode",
        sortable: true,
        className: "text-muted-foreground px-4 py-3 text-xs",
        render: (p) =>
          p.start_date || p.end_date
            ? `${p.start_date ? new Date(p.start_date).toLocaleDateString("id-ID") : "-"} → ${p.end_date ? new Date(p.end_date).toLocaleDateString("id-ID") : "-"}`
            : "Selalu",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        className: "px-4 py-3",
        render: (p) => (
          <span
            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
              p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {p.is_active ? "AKTIF" : "NONAKTIF"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi",
        align: "right",
        className: "px-4 py-3",
        headerClassName: "text-right",
        render: (p) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => openEdit(p)}
              className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(p.id, p.code)}
              disabled={isSubmitting}
              className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [isSubmitting, openEdit, handleDelete],
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kode Promo</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola kode promo untuk checkout storefront (diskon, kuota, periode berlakunya).
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.97] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Kode Promo
        </button>
      </div>

      {error && (
        <div className="border-border-soft border-l-4 border-l-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="text-faint-foreground absolute top-2.5 left-3 h-4 w-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode promo..."
          className="border-border bg-card w-full rounded-lg border py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        rows={pageItems}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        emptyMessage="Belum ada kode promo."
        emptyContent={
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-sm">
            <Tag className="h-6 w-6 opacity-40" />
            <span>Belum ada kode promo.</span>
          </div>
        }
        footer={
          filtered.length > 0 ? (
            <Pagination
              currentPage={safePage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              itemLabel="promo"
            />
          ) : undefined
        }
      />

      {/* Create / Edit Modal */}
      {(isAddOpen || isAddClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">
                  {editing !== null ? "Edit Kode Promo" : "Tambah Kode Promo"}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editing !== null
                    ? "Ubah pengaturan kode promo."
                    : "Buat kode promo baru untuk storefront."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Kode Promo
                    </label>
                    <input
                      value={form.code}
                      onChange={(e) => setField("code", e.target.value.toUpperCase())}
                      required
                      placeholder="CONTOH10"
                      className="border-border w-full rounded-lg border px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Tipe Diskon
                    </label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setField("discount_type", e.target.value)}
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="percent">Persen (%)</option>
                      <option value="fixed">Nominal (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Nilai Diskon
                    </label>
                    <input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setField("discount_value", e.target.value)}
                      required
                      min="1"
                      placeholder="10 / 5000"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Min Order (Rp)
                    </label>
                    <input
                      type="number"
                      value={form.min_order}
                      onChange={(e) => setField("min_order", e.target.value)}
                      min="0"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Maks Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      value={form.max_discount}
                      onChange={(e) => setField("max_discount", e.target.value)}
                      min="0"
                      placeholder="0 = tanpa batas"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Kuota Total
                    </label>
                    <input
                      type="number"
                      value={form.quota}
                      onChange={(e) => setField("quota", e.target.value)}
                      min="0"
                      placeholder="100"
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setField("is_active", e.target.checked)}
                        className="h-4 w-4"
                      />
                      Aktif
                    </label>
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Mulai
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start_date}
                      onChange={(e) => setField("start_date", e.target.value)}
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Berakhir
                    </label>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) => setField("end_date", e.target.value)}
                      className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <div className="flex w-full flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>{editing !== null ? "Simpan Perubahan" : "Simpan Kode Promo"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
