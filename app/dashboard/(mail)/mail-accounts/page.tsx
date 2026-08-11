"use client";

import React, { useState } from "react";
import { Plus, Search, Trash2, Edit, X, Save, Loader2, Mail, AlertCircle, Key, Copy, Check, RefreshCw } from "lucide-react";
import { useEmailAccounts } from "@/lib/hooks/features/useEmailAccounts";
import { Pagination } from "@/components/ui/Pagination";

export default function EmailAccountsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      generateNewPin,
    },
  } = useEmailAccounts();

  const handleCopyPin = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kelola Akun Email</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Alamat email & PIN Akses untuk membaca pesan masuk dan OTP di Feryshop WebMail.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun Email
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="text-faint-foreground absolute top-2.5 left-3 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email, nama, atau PIN..."
            className="border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-xl border py-2 text-xs font-medium pr-3 pl-9 shadow-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-faint-foreground hover:text-muted-foreground absolute top-2.5 right-3 text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="border-border-soft bg-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground mt-3 text-xs font-medium">Memuat data akun email...</p>
        </div>
      ) : pageItems.length === 0 ? (
        <div className="border-border-soft bg-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center shadow-xs">
          <Mail className="text-faint-foreground h-10 w-10 stroke-[1.5]" />
          <h3 className="text-foreground mt-3 text-sm font-bold">Belum Ada Akun Email</h3>
          <p className="text-muted-foreground mt-1 max-w-xs text-xs">
            {search
              ? "Tidak ada akun email yang cocok dengan kata kunci pencarian Anda."
              : "Tambahkan akun email baru untuk menampung pesan OTP pembelian."}
          </p>
        </div>
      ) : (
        <div className="border-border-soft bg-card overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full min-w-140 text-left text-sm">
            <thead className="border-border-soft bg-muted/50 text-faint-foreground border-b text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Akun Email</th>
                <th className="px-5 py-3.5">PIN Akses WebMail</th>
                <th className="px-5 py-3.5">Sync Terakhir</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.map((acc) => {
                const currentPin = (acc as unknown as { access_pin?: string }).access_pin || "123456";
                return (
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

                    {/* PIN Akses Column */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 tracking-wider">
                          {currentPin}
                        </span>
                        <button
                          onClick={() => handleCopyPin(acc.id, currentPin)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Salin PIN Akses"
                        >
                          {copiedId === acc.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
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
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold tracking-wider ${
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
                          title="Edit Akun & PIN"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc)}
                          disabled={isSubmitting}
                          className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          title="Hapus Akun"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                  {editing ? "Edit Akun Email & PIN" : "Tambah Akun Email Baru"}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editing
                    ? "Ubah rincian akun dan PIN Akses WebMail penerima email ini."
                    : "Daftarkan alamat email baru & set PIN Akses pembeli."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1 transition-colors"
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
                    Alamat Email Virtual <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                    placeholder="otp@feryshop.com"
                    className="border-border w-full rounded-xl border px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Nama Tampilan */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">Nama Tampilan (Catatan Internal)</label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setField("display_name", e.target.value)}
                    placeholder="Contoh: Akun Sultan ML BB - Unit #04"
                    className="border-border w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* PIN Akses WebMail */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-semibold">
                      PIN Akses WebMail (6-Digit) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateNewPin}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Acak PIN Baru
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.access_pin}
                      onChange={(e) => setField("access_pin", e.target.value)}
                      required
                      placeholder="Misal: 849201"
                      className="border-border w-full rounded-xl border px-3 py-2.5 font-mono text-sm font-bold tracking-widest text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Key className="absolute top-3 right-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    PIN ini akan diberikan kepada pembeli untuk membaca OTP di WebMail.
                  </p>
                </div>

                {/* Toggle Aktif */}
                <label className="border-border bg-muted/40 hover:bg-muted/70 flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setField("is_active", e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <div>
                    <div className="text-foreground text-xs font-semibold">Akun Aktif</div>
                    <div className="text-muted-foreground text-xs font-normal">
                      Mengizinkan penerimaan email & login di WebMail
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editing ? "Simpan Perubahan" : "Tambah Akun Email"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="text-muted-foreground hover:bg-muted inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
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
