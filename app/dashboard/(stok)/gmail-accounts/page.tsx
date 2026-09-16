"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  Save,
  Loader2,
  Mail,
  AlertCircle,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  History,
  Shield,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { useGmailAccounts } from "@/lib/hooks/features/useGmailAccounts";
import { Pagination } from "@/components/ui/Pagination";
import { GmailStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, parseBackupCodes, maskBackupCodes } from "@/lib/utils";
import type { GmailAccount, GmailAccountStatus } from "@/types/database";

const STATUS_OPTIONS: GmailAccountStatus[] = [
  "Belum diamankan",
  "Diproses",
  "Dipakai sementara",
  "Stok Permanen",
  "Diserahkan ke Customer",
  "Bermasalah",
  "Non Aktif",
];

export default function GmailAccountsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealedBackupCodes, setRevealedBackupCodes] = useState<Record<string, boolean>>({});
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [showBackupCodesInForm, setShowBackupCodesInForm] = useState(false);
  const backupCodesOverlayRef = useRef<HTMLDivElement | null>(null);

  const {
    data: { filtered, pageItems, safePage, itemsPerPage, kpis, logs },
    isLoading,
    isSubmitting,
    isLogsLoading,
    error,
    uiState: {
      search,
      statusFilter,
      isAddOpen,
      isAddClosing,
      editing,
      form,
      isLogsOpen,
      selectedAccountForLogs,
    },
    actions: {
      setSearch,
      setStatusFilter,
      setField,
      openAdd,
      openEdit,
      closeModal,
      openStatusLogs,
      closeStatusLogs,
      handleSave,
      handleQuickStatusChange,
      handleDelete,
      setCurrentPage,
      setItemsPerPage,
    },
  } = useGmailAccounts();

  const handleOpenAdd = () => {
    setShowPasswordInForm(false);
    setShowBackupCodesInForm(false);
    openAdd();
  };

  const handleOpenEdit = (acc: GmailAccount) => {
    setShowPasswordInForm(false);
    setShowBackupCodesInForm(false);
    openEdit(acc);
  };

  const handleCloseModal = () => {
    setShowPasswordInForm(false);
    setShowBackupCodesInForm(false);
    closeModal();
  };

  const formBackupCodesList = parseBackupCodes(form.backup_codes);

  const handleCopy = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBackupCodeReveal = (id: string) => {
    setRevealedBackupCodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">Inventori Gmail</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola akun Google, kata sandi, kode cadangan (10 kode × 8 digit), dan pantau siklus
            hidup akun operasional.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun Gmail
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "ALL"
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-muted-foreground text-[11px] font-medium">Total Akun</span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Belum diamankan")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Belum diamankan"
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Belum Aman
          </span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.belumDiamankan}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Diproses")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Diproses"
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Diproses</span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.diproses}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Dipakai sementara")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Dipakai sementara"
              ? "border-violet-500 ring-2 ring-violet-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400">
            Sementara
          </span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.dipakaiSementara}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Stok Permanen")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Stok Permanen"
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Permanen
          </span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.stokPermanen}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Diserahkan ke Customer")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Diserahkan ke Customer"
              ? "border-orange-500 ring-2 ring-orange-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
            Customer
          </span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.diserahkanCustomer}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Bermasalah")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Bermasalah"
              ? "border-rose-500 ring-2 ring-rose-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
            Bermasalah
          </span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.bermasalah}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("Non Aktif")}
          className={`bg-card hover:border-border flex flex-col rounded-xl border p-3 text-left transition-all ${
            statusFilter === "Non Aktif"
              ? "border-slate-500 ring-2 ring-slate-500/20"
              : "border-border-soft"
          }`}
        >
          <span className="text-muted-foreground text-[11px] font-medium">Non Aktif</span>
          <span className="text-foreground mt-1 text-lg font-bold">{kpis.nonAktif}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email, catatan, atau pengelola..."
            className="border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-xl border py-2 pr-3 pl-9 text-xs font-medium shadow-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground absolute top-2.5 right-3 text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-card text-foreground rounded-xl border px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Status</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Account List */}
      {isLoading ? (
        <div className="border-border-soft bg-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground mt-3 text-xs font-medium">
            Memuat inventori akun Gmail...
          </p>
        </div>
      ) : pageItems.length === 0 ? (
        <div className="border-border-soft bg-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center shadow-xs">
          <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-2xl">
            <Mail className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-foreground mt-3 text-sm font-bold">Belum Ada Akun Gmail</h3>
          <p className="text-muted-foreground mt-1 max-w-xs text-xs">
            {search || statusFilter !== "ALL"
              ? "Tidak ada akun Gmail yang cocok dengan filter atau kata kunci pencarian Anda."
              : "Mulai tambahkan akun Google ke inventori untuk mendokumentasikan kredensial dan siklus amannya."}
          </p>
          {(search || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="border-border text-foreground hover:bg-muted mt-4 rounded-xl border px-3 py-1.5 text-xs font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pageItems.map((acc: GmailAccount) => {
            const isPasswordRevealed = revealedPasswords[acc.id] ?? false;
            const isBackupCodeRevealed = revealedBackupCodes[acc.id] ?? false;
            const parsedCodes = parseBackupCodes(acc.backup_codes);

            return (
              <div
                key={acc.id}
                className="border-border-soft bg-card hover:border-border flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all"
              >
                <div>
                  {/* Card Header: Email & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground font-mono text-sm font-bold tracking-tight">
                            {acc.email}
                          </span>
                          <button
                            onClick={() => handleCopy(acc.email, `email-${acc.id}`)}
                            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                            title="Salin Email"
                          >
                            {copiedId === `email-${acc.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" />
                          <span>Ditambahkan: {formatDate(acc.created_at, true)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <GmailStatusBadge status={acc.status} />
                    </div>
                  </div>

                  {/* Sensitive Credentials Box (Encrypted at rest) */}
                  <div className="bg-muted/40 border-border-soft mt-4 space-y-2.5 rounded-xl border p-3">
                    {/* Password */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Key className="h-3.5 w-3.5" />
                        <span>Kata Sandi:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-mono font-semibold">
                          {acc.google_password
                            ? isPasswordRevealed
                              ? acc.google_password
                              : "••••••••••••"
                            : "(Belum ada)"}
                        </span>
                        {acc.google_password && (
                          <>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(acc.id)}
                              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                              title={isPasswordRevealed ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
                            >
                              {isPasswordRevealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.google_password || "", `pwd-${acc.id}`)}
                              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                              title="Salin Kata Sandi"
                            >
                              {copiedId === `pwd-${acc.id}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Backup Codes */}
                    <div className="border-border/40 border-t pt-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Shield className="h-3.5 w-3.5" />
                          <span>Kode Cadangan:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {acc.backup_codes ? (
                            <>
                              <span className="text-foreground font-mono text-[11px] font-semibold">
                                {isBackupCodeRevealed
                                  ? `${parsedCodes.length} Kode Tersedia`
                                  : `${parsedCodes.length || "•"} Kode Tersimpan`}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleBackupCodeReveal(acc.id)}
                                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                                title={
                                  isBackupCodeRevealed
                                    ? "Sembunyikan Kode"
                                    : "Tampilkan Kode Cadangan"
                                }
                              >
                                {isBackupCodeRevealed ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(acc.backup_codes || "", `codes-${acc.id}`)
                                }
                                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                                title="Salin Semua Kode Cadangan"
                              >
                                {copiedId === `codes-${acc.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[11px]">
                              (Belum ada)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded View when Revealed */}
                      {acc.backup_codes && isBackupCodeRevealed && (
                        <div className="bg-muted/40 border-border/50 mt-2.5 rounded-lg border p-2">
                          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10px] font-medium">
                            <span>Klik salah satu kode untuk menyalin:</span>
                            <span className="text-foreground font-semibold">
                              {parsedCodes.length}/10 kode
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {parsedCodes.map((code, idx) => {
                              const formatted =
                                code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
                              const isCodeCopied = copiedId === `code-${acc.id}-${idx}`;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleCopy(code, `code-${acc.id}-${idx}`)}
                                  className="border-border/40 hover:bg-background hover:border-border group bg-background/70 flex items-center justify-between rounded-md border px-2 py-1 font-mono text-[11px] transition-colors"
                                  title={`Klik untuk menyalin kode #${idx + 1}`}
                                >
                                  <span className="text-muted-foreground mr-1 text-[10px]">
                                    {idx + 1}.
                                  </span>
                                  <span className="text-foreground font-semibold tracking-wider">
                                    {formatted}
                                  </span>
                                  {isCodeCopied ? (
                                    <Check className="ml-1 h-3 w-3 shrink-0 text-emerald-600" />
                                  ) : (
                                    <Copy className="text-muted-foreground group-hover:text-foreground ml-1 h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes (if any) */}
                  {acc.notes && (
                    <div className="mt-3 text-xs">
                      <span className="text-muted-foreground font-medium">Catatan: </span>
                      <span className="text-foreground/90">{acc.notes}</span>
                    </div>
                  )}

                  {/* Manager / Admin Info */}
                  {acc.manager && (
                    <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[11px]">
                      <User className="h-3 w-3" />
                      <span>Dikelola: {acc.manager.full_name || acc.manager.email}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Quick Status Switcher & Actions */}
                <div className="border-border-soft mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[11px] font-medium">
                      Ubah Status:
                    </span>
                    <select
                      value={acc.status}
                      onChange={(e) =>
                        handleQuickStatusChange(acc, e.target.value as GmailAccountStatus)
                      }
                      className="border-border bg-card text-foreground rounded-lg border px-2 py-1 text-[11px] font-medium outline-none focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openStatusLogs(acc)}
                      className="border-border-soft bg-card text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                      title="Lihat Riwayat Perubahan Status"
                    >
                      <History className="h-3.5 w-3.5 text-blue-500" />
                      <span>Riwayat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      title="Edit Akun"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(acc)}
                      disabled={isSubmitting}
                      className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                      title="Hapus Akun"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Drawer 1: Tambah / Edit Akun Gmail */}
      {(isAddOpen || isAddClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
            isAddClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={handleCloseModal}
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
                  {editing ? "Edit Akun Gmail" : "Tambah Akun Gmail Baru"}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editing
                    ? "Perbarui kredensial, kode cadangan, catatan, atau status akun."
                    : "Daftarkan akun Google baru ke inventori operasional."}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleSave} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5">
                {/* Inline error */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">
                    Alamat Email Google <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="namaakun@gmail.com"
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Password Google */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-semibold">
                      Kata Sandi Google
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                      className="text-muted-foreground hover:text-foreground text-[11px] font-medium"
                    >
                      {showPasswordInForm ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                  <input
                    type={showPasswordInForm ? "text" : "password"}
                    value={form.google_password}
                    onChange={(e) => setField("google_password", e.target.value)}
                    placeholder="Masukkan kata sandi akun..."
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Kode Cadangan (Google Backup Codes) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-semibold">
                      Kode Cadangan (10 Kode × 8 Digit)
                    </label>
                    <div className="flex items-center gap-2">
                      {formBackupCodesList.length > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            formBackupCodesList.length === 10
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {formBackupCodesList.length}/10 kode terdeteksi
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowBackupCodesInForm(!showBackupCodesInForm)}
                        className="text-muted-foreground hover:text-foreground text-[11px] font-medium"
                      >
                        {showBackupCodesInForm ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Ditemukan di Akun Google: <strong>Keamanan &amp; Login</strong> &gt;{" "}
                    <strong>Kode Cadangan</strong>. Berisi 10 kode cadangan 8 digit angka.{" "}
                    <span className="text-foreground/90 font-medium">
                      Beri tanda koma (,) atau baris baru untuk memisahkan setiap kode.
                    </span>
                  </p>
                  <div className="relative w-full">
                    {/* Overlay teks ter-obfuscate: mendigitalkan kode jadi bullet tetapi membiarkan koma tetap terlihat apa adanya */}
                    {!showBackupCodesInForm && form.backup_codes && (
                      <div
                        ref={backupCodesOverlayRef}
                        aria-hidden="true"
                        className="text-foreground pointer-events-none absolute inset-0 z-10 overflow-y-auto rounded-xl border border-transparent px-3 py-2.5 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap select-none"
                      >
                        {maskBackupCodes(form.backup_codes)}
                      </div>
                    )}

                    <textarea
                      rows={5}
                      value={form.backup_codes}
                      onChange={(e) => setField("backup_codes", e.target.value)}
                      onScroll={(e) => {
                        if (backupCodesOverlayRef.current) {
                          backupCodesOverlayRef.current.scrollTop = e.currentTarget.scrollTop;
                        }
                      }}
                      placeholder={`Tempel 10 kode cadangan dari Google. Pisahkan dengan tanda koma (,), contoh:\n12345678, 23456789, 34567890, 45678901...\natau dengan baris baru:\n1234 5678\n8765 4321`}
                      className={`border-border bg-background w-full resize-none rounded-xl border px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                        !showBackupCodesInForm && form.backup_codes
                          ? "caret-foreground text-transparent selection:bg-blue-500/20"
                          : "text-foreground"
                      }`}
                    />
                  </div>
                </div>

                {/* Status Akun */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">
                    Status Akun <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value as GmailAccountStatus)}
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan Tambahan */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground text-xs font-semibold">Catatan Internal</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Contoh: Akun khusus recovery game Genshin / MLBB..."
                    className="border-border bg-background text-foreground w-full rounded-xl border px-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-border-soft bg-muted/20 flex items-center justify-end gap-2.5 border-t px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="border-border text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{editing ? "Perbarui Akun" : "Simpan Akun"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer 2: Timeline Riwayat Perubahan Status (Status Logs) */}
      {isLogsOpen && selectedAccountForLogs && (
        <div
          className="fs-overlay-in fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm"
          onClick={closeStatusLogs}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card fs-drawer-in flex h-full w-full max-w-md flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-500" />
                  <h2 className="text-foreground text-base font-bold">Riwayat Status</h2>
                </div>
                <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                  {selectedAccountForLogs.email}
                </p>
              </div>
              <button
                onClick={closeStatusLogs}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body - Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLogsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-muted-foreground mt-2 text-xs">Memuat riwayat status...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center text-xs">
                  <History className="text-muted-foreground/50 mb-2 h-8 w-8 stroke-[1.5]" />
                  <p className="text-foreground font-semibold">Belum Ada Riwayat Perubahan</p>
                  <p className="mt-1 max-w-xs">
                    Perubahan status akun di masa mendatang akan otomatis tercatat di timeline ini.
                  </p>
                </div>
              ) : (
                <div className="border-border/80 relative ml-3 space-y-6 border-l-2 pl-5">
                  {logs.map((log, index) => (
                    <div key={log.id || index} className="relative">
                      {/* Timeline dot */}
                      <span className="border-card absolute top-1 -left-6.75 h-3.5 w-3.5 rounded-full border-2 bg-blue-600 ring-2 ring-blue-500/20" />

                      <div className="flex flex-col gap-1">
                        {/* Status transition */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {log.previous_status ? (
                            <>
                              <GmailStatusBadge status={log.previous_status} />
                              <span className="text-muted-foreground text-xs">→</span>
                              <GmailStatusBadge status={log.new_status} />
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <GmailStatusBadge status={log.new_status} />
                              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                (Pendaftaran Pertama)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Admin */}
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
                          <span>{formatDate(log.created_at, true)}</span>
                          <span>•</span>
                          <span>{log.changer?.full_name || log.changer?.email || "Admin"}</span>
                        </div>

                        {/* Note */}
                        {log.notes && (
                          <div className="bg-muted/40 border-border-soft text-foreground/90 mt-1.5 rounded-lg border p-2 text-xs">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="border-border-soft bg-muted/20 flex items-center justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={closeStatusLogs}
                className="border-border text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
