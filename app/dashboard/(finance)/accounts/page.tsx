"use client";

import Link from "next/link";
import React from "react";
import {
  Plus,
  ArrowRightLeft,
  Wallet,
  MoreHorizontal,
  X,
  Loader2,
  Pencil,
  Trash2,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useAccounts } from "@/lib/hooks/features/useAccounts";

export default function AccountsPage() {
  const {
    data: { accounts, totalBalance, adjustments },
    isLoading,
    isSubmitting,
    isDeletingId,
    error,
    uiState: {
      isAddAccountOpen,
      isAddAccountClosing,
      isMutasiOpen,
      isMutasiClosing,
      isAdjustOpen,
      isAdjustClosing,
      editingAccount,
      isEditAccountClosing,
      openMenuId,
      currentUserRole,
    },
    refs: { menuRef },
    helpers: { getIcon, getColor },
    actions: {
      openAddAccount,
      closeAddAccount,
      openMutasi,
      closeMutasi,
      openAdjust,
      closeAdjust,
      setEditingAccount,
      closeEditAccount,
      setOpenMenuId,
      handleAddAccount,
      handleUpdateAccount,
      handleDeleteAccount,
      handleMutasi,
      handleRequestAdjustment,
      handleApproveAdjustment,
      handleRejectAdjustment,
    },
  } = useAccounts();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kelola Rekening</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Pantau saldo, kelola metode pembayaran, dan mutasi antar dompet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openMutasi}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.97]"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Mutasi Saldo
          </button>
          <button
            onClick={openAdjust}
            className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.97]"
          >
            <Sliders className="h-4 w-4" />
            Koreksi Saldo
          </button>
          <button
            onClick={openAddAccount}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Tambah Rekening
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="group border-border-soft bg-card relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center">
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-64 opacity-[0.02] transition-opacity group-hover:opacity-5"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          <path d="M0,50 L0,30 Q25,50 50,20 T100,10 L100,50 Z" fill="#2563eb" />
        </svg>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-faint-foreground text-xs font-semibold tracking-wider uppercase">
              Total Saldo Kas
            </h2>
            <p className="text-foreground mt-1 text-3xl font-bold tracking-tight">
              {formatRupiah(totalBalance)}
            </p>
          </div>
        </div>
        <div className="border-border-soft bg-muted relative z-10 flex flex-col items-end rounded-xl border px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">Jumlah Rekening Aktif</span>
          <span className="text-foreground text-lg font-bold">
            {accounts.filter((a) => a.is_active).length}
          </span>
        </div>
      </div>

      {/* Grid of Accounts */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const IconComponent = getIcon(account.type);
            const colorClass = getColor(account.type);
            const isMenuOpen = openMenuId === account.id;

            return (
              <div
                key={account.id}
                className="group border-border-soft bg-card hover:border-border relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  {/* Card Header & Action Dropdown */}
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${colorClass}`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-foreground text-base leading-tight font-bold">
                            {account.name}
                          </h3>
                          {!account.is_active && (
                            <span className="bg-muted text-faint-foreground rounded px-1.5 py-0.5 text-xs font-semibold">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs font-medium">{account.type}</p>
                      </div>
                    </div>

                    {/* Action Menu Toggle Button */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : account.id)}
                        title="Opsi Rekening"
                        className={`rounded-lg p-1.5 transition-colors ${
                          isMenuOpen
                            ? "bg-muted text-foreground"
                            : "text-faint-foreground hover:bg-muted hover:text-muted-foreground"
                        }`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="fs-drop-in border-border-soft bg-card absolute top-8 right-0 z-30 w-44 rounded-xl border p-1.5 shadow-xl"
                        >
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setEditingAccount(account);
                            }}
                            className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            Edit Rekening
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account)}
                            disabled={isDeletingId === account.id}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          >
                            {isDeletingId === account.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            )}
                            Hapus Rekening
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="border-border-soft bg-muted/70 mb-4 rounded-xl border p-3">
                    <p className="text-faint-foreground mb-0.5 text-xs font-semibold tracking-wider uppercase">
                      Nomor Rekening / ID
                    </p>
                    <p className="text-foreground font-mono text-sm font-semibold tracking-wide">
                      {account.account_number || "-"}
                    </p>
                  </div>
                </div>

                {/* Balance Footer */}
                <div className="border-border-soft flex items-end justify-between border-t pt-4">
                  <div>
                    <p className="text-faint-foreground mb-0.5 text-xs font-semibold tracking-wider uppercase">
                      Saldo Terkini
                    </p>
                    <p className="text-foreground text-xl font-bold tracking-tight">
                      {formatRupiah(Number(account.balance))}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/ledger?accountId=${account.id}`}
                    className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                  >
                    Riwayat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {(isAddAccountOpen || isAddAccountClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isAddAccountClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeAddAccount}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isAddAccountClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Tambah Rekening Baru</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Isi form untuk menambah rekening atau metode pembayaran baru.
                </p>
              </div>
              <button
                onClick={closeAddAccount}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              action={handleAddAccount}
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
                    Nama Rekening <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Misal: BCA Fery, QRIS Toko"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Tipe Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Bank Konvensional">Bank Konvensional</option>
                    <option value="Bank Digital">Bank Digital</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="E-Wallet/QRIS">E-Wallet/QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Nomor Rekening / ID
                  </label>
                  <input
                    name="account_number"
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Misal: 1234567890"
                  />
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeAddAccount}
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
                    <span>Simpan Rekening</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isEditAccountClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeEditAccount}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isEditAccountClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Edit Rekening</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Ubah rincian nama, tipe, nomor rekening, atau status aktif.
                </p>
              </div>
              <button
                onClick={closeEditAccount}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              action={handleUpdateAccount}
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
                    Nama Rekening <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={editingAccount.name}
                    type="text"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Tipe Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue={editingAccount.type}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Bank Konvensional">Bank Konvensional</option>
                    <option value="Bank Digital">Bank Digital</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="E-Wallet/QRIS">E-Wallet/QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Nomor Rekening / ID
                  </label>
                  <input
                    name="account_number"
                    type="text"
                    defaultValue={editingAccount.account_number || ""}
                    className="border-border w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    value="true"
                    defaultChecked={editingAccount.is_active}
                    className="border-input h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-foreground text-xs font-medium">
                    Rekening Aktif (Dapat digunakan untuk transaksi & mutasi)
                  </label>
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeEditAccount}
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
                    <span>Update Rekening</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mutasi Modal */}
      {(isMutasiOpen || isMutasiClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm ${
            isMutasiClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeMutasi}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
              isMutasiClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft bg-muted/50 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-base font-bold">Mutasi Saldo</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Pindahkan saldo antar rekening atau dompet digital.
                </p>
              </div>
              <button
                onClick={closeMutasi}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleMutasi} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Dari Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="from_account_id"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - {formatRupiah(Number(acc.balance))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative z-10 -my-1 flex justify-center">
                  <div className="bg-muted text-muted-foreground rounded-full border border-white p-1">
                    <ArrowRightLeft className="h-3.5 w-3.5 rotate-90" />
                  </div>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Ke Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="to_account_id"
                    required
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    Nominal Mutasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    placeholder="Rp 0"
                  />
                </div>
              </div>
              <div className="border-border-soft bg-muted/50 flex items-center justify-end gap-3 border-t p-6">
                <button
                  type="button"
                  onClick={closeMutasi}
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
                    <span>Proses Mutasi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OWNER: Approval Panel */}
      {currentUserRole === "OWNER" && adjustments.filter((a) => a.status === "PENDING").length > 0 && (
        <div className="border-border-soft bg-card rounded-2xl border p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-foreground text-sm font-bold">Permintaan Koreksi Saldo Menunggu Persetujuan</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {adjustments.filter((a) => a.status === "PENDING").length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {adjustments
              .filter((a) => a.status === "PENDING")
              .map((adj) => (
                <div
                  key={adj.id}
                  className="border-border-soft bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-semibold">
                        {adj.accounts?.name ?? "—"}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          adj.amount >= 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {adj.amount >= 0 ? "+" : ""}
                        {formatRupiah(adj.amount)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">{adj.notes}</p>
                    <p className="text-faint-foreground text-xs">
                      Diajukan oleh: {adj.requested?.full_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleApproveAdjustment(adj.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleRejectAdjustment(adj.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {error && (
            <p className="mt-3 text-xs text-rose-600">{error}</p>
          )}
        </div>
      )}

      {/* Adjustment Request Drawer */}
      {isAdjustOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center ${
            isAdjustClosing ? "animate-fadeOut" : "animate-fadeIn"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeAdjust}
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl ${
              isAdjustClosing ? "animate-slideDown" : "animate-slideUp"
            }`}
          >
            {/* Header */}
            <div className="border-border-soft flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-foreground text-base font-bold">Ajukan Koreksi Saldo</h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {currentUserRole === "OWNER"
                    ? "Koreksi akan langsung diterapkan."
                    : "Pengajuan akan diverifikasi oleh Owner."}
                </p>
              </div>
              <button
                onClick={closeAdjust}
                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form action={handleRequestAdjustment} className="flex flex-col gap-5 p-6">
              {/* Rekening */}
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Rekening <span className="text-rose-500">*</span>
                </label>
                <select
                  name="account_id"
                  required
                  className="border-border text-foreground w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">Pilih rekening...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatRupiah(Number(acc.balance))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Nominal Koreksi <span className="text-rose-500">*</span>
                </label>
                <p className="text-muted-foreground mb-1.5 text-xs">
                  Gunakan nilai positif untuk menambah, negatif untuk mengurangi saldo.
                </p>
                <input
                  type="number"
                  name="amount"
                  required
                  placeholder="cth: 50000 atau -25000"
                  className="border-border text-foreground w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {/* Alasan */}
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Alasan / Catatan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="notes"
                  required
                  rows={3}
                  placeholder="Jelaskan alasan koreksi saldo ini..."
                  className="border-border text-foreground w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="border-border-soft flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeAdjust}
                  className="text-muted-foreground hover:bg-muted rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Ajukan Koreksi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
