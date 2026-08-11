"use client";

import React from "react";
import { Plus, Search, Trash2, Edit, X, Save, Loader2, Mail, AlertCircle } from "lucide-react";
import { useEmailAccounts } from "@/lib/hooks/features/useEmailAccounts";
import { Pagination } from "@/components/ui/Pagination";

export default function EmailAccountsPage() {
  const {
    data: { accounts, filtered, pageItems, safePage, itemsPerPage },
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
    },
  } = useEmailAccounts();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kelola Akun Email</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Alamat email yang menjadi penerima kode OTP di kotak masuk FerryMail.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun Email
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-faint-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email atau nama akun..."
          className="border-border bg-card w-full rounded-xl border py-2.5 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-border-soft text-muted-foreground flex flex-col items-center gap-3 rounded-2xl border py-16 text-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-500">
            <Mail className="h-5 w-5" />
          </div>
          <p className="max-w-xs text-center">
            {accounts.length === 0
              ? "Belum ada akun email. Tambahkan alamat penerima OTP untuk mulai menerima email."
              : "Tidak ada akun yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="border-border-soft bg-card overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full min-w-140 text-left text-sm">
            <thead className="border-border-soft bg-muted/50 text-faint-foreground border-b text-xs font-bold tracking-wide uppercase">
              <tr>
                <th className="px-5 py-3.5">Akun</th>
                <th className="px-5 py-3.5">Sync Terakhir</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((acc) => (
                <tr
                  key={acc.id}
                  className="border-border-soft hover:bg-muted/30 border-b transition-colors last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="text-foreground leading-snug font-semibold">
                      {acc.display_name || acc.email}
                    </div>
                    {acc.display_name && (
                      <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                        {acc.email}
                      </div>
                    )}
                  </td>
                  <td className="text-muted-foreground px-5 py-4 text-xs">
                    {acc.last_synced_at
                      ? new Date(acc.last_synced_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum pernah"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
                        acc.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {acc.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(acc)}
                        className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        disabled={isSubmitting}
                        className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-40"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          itemLabel="akun"
        />
      )}

      {/* Create / Edit Drawer */}
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
            {/* Drawer Header */}
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">
                  {editing ? "Edit Akun Email" : "Tambah Akun Email"}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editing
                    ? "Ubah rincian akun penerima email ini."
                    : "Daftarkan alamat email baru sebagai penerima OTP."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleSave} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                {/* Inline error inside drawer */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Alamat Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                    placeholder="otp@ferryshop.com"
                    className="border-border w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Nama Tampilan */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">Nama Tampilan</label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setField("display_name", e.target.value)}
                    placeholder="Contoh: Kotak Masuk OTP Utama"
                    className="border-border w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Toggle Aktif */}
                <label className="border-border bg-muted/40 hover:bg-muted/70 flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setField("is_active", e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <div>
                    <div className="text-foreground text-xs font-semibold">Akun Aktif</div>
                    <div className="text-muted-foreground text-xs font-normal">
                      Ikut disinkronkan saat FerryMail berjalan
                    </div>
                  </div>
                </label>
              </div>

              {/* Drawer Footer */}
              <div className="border-border-soft bg-card border-t px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>{editing ? "Simpan Perubahan" : "Simpan Akun Email"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:bg-muted rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
