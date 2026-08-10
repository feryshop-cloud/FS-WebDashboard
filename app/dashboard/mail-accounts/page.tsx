"use client";

import React from "react";
import { Plus, Search, Trash2, Edit, X, Save, Loader2, Mail } from "lucide-react";
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
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kelola Akun Email</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Alamat email yang menjadi penerima kode OTP di kotak masuk FerryMail.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.97] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun Email
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
          placeholder="Cari email atau nama akun..."
          className="border-border bg-card w-full rounded-lg border py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-border-soft text-muted-foreground flex flex-col items-center gap-2 rounded-xl border py-12 text-sm">
          <Mail className="h-6 w-6 opacity-40" />
          {accounts.length === 0
            ? "Belum ada akun email. Tambahkan alamat penerima OTP untuk mulai menerima email."
            : "Tidak ada akun yang cocok dengan pencarian."}
        </div>
      ) : (
        <div className="border-border-soft bg-card overflow-x-auto rounded-xl border shadow-sm">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-border-soft bg-muted/50 text-faint-foreground border-b text-xs font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Akun</th>
                <th className="px-4 py-3">Sync Terakhir</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((acc) => (
                <tr
                  key={acc.id}
                  className="border-border-soft hover:bg-muted/30 border-b last:border-0"
                >
                  <td className="px-5 py-3">
                    <div className="text-foreground font-semibold">
                      {acc.display_name || acc.email}
                    </div>
                    {acc.display_name && (
                      <div className="text-muted-foreground font-mono text-xs">{acc.email}</div>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
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
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        acc.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {acc.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(acc)}
                        className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc)}
                        disabled={isSubmitting}
                        className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
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
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                    placeholder="otp@ferryshop.com"
                    className="border-border w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setField("display_name", e.target.value)}
                    placeholder="Contoh: Kotak Masuk OTP Utama"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end pt-1">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                      className="h-4 w-4"
                    />
                    Akun Aktif (ikut disinkronkan)
                  </label>
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
                        <span>{editing ? "Simpan Perubahan" : "Simpan Akun Email"}</span>
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
