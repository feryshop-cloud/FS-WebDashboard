"use client";

import React from "react";
import {
  Search,
  Copy,
  Check,
  Shield,
  Inbox,
  Square,
  CheckSquare,
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  Star,
  Mail,
  MailOpen,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { useFerryMail } from "@/lib/hooks/features/useFerryMail";

export default function FerryMailPage() {
  const {
    data: { filteredEmails, accounts, isLoadingAccounts },
    uiState: {
      selectedEmail,
      searchQuery,
      copied,
      activeTab,
      allFilteredChecked,
      selectedAccountId,
      isDeleting,
      checkedCount,
      openMenu,
    },
    refs: { menuRef },
    actions: {
      setSelectedEmail,
      setSearchQuery,
      setActiveTab,
      setSelectedAccountId,
      handleCopy,
      toggleCheck,
      toggleStar,
      toggleAllChecks,
      reloadInbox,
      handleDeleteEmail,
      handleBulkDelete,
      markAsRead,
      setOpenMenu,
      archiveEmail,
      restoreEmail,
      bulkArchive,
    },
  } = useFerryMail();

  return (
    <div className="border-border bg-card -mx-8 -my-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden border-t font-sans select-none">
      {!selectedEmail ? (
        // INBOX LIST VIEW
        <div className="bg-card flex flex-1 flex-col overflow-hidden">
          {/* Unified Header Bar */}
          <div className="border-border flex min-h-12 shrink-0 items-center border-b px-4 pt-2">
            {/* Actions */}
            <div className="text-muted-foreground flex w-63 shrink-0 items-center gap-2">
              <button
                onClick={toggleAllChecks}
                className="hover:bg-muted rounded p-1 transition-colors"
              >
                {allFilteredChecked ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => reloadInbox()}
                className="hover:bg-muted rounded p-1 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {checkedCount > 0 && (
                <>
                  <button
                    onClick={bulkArchive}
                    className="hover:bg-muted text-foreground rounded p-1 transition-colors"
                    title={`Arsipkan ${checkedCount} email`}
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="hover:bg-rose-50 text-rose-600 rounded p-1 transition-colors disabled:opacity-50"
                    title={`Hapus ${checkedCount} email`}
                  >
                    <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
                  </button>
                </>
              )}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(!openMenu)}
                  className={`hover:bg-muted rounded p-1 transition-colors ${
                    openMenu ? "bg-muted text-foreground" : ""
                  }`}
                  title="Opsi lainnya"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openMenu && (
                  <div
                    ref={menuRef}
                    className="fs-drop-in border-border-soft bg-card absolute top-8 left-0 z-30 w-48 rounded-xl border p-1.5 shadow-xl"
                  >
                    <button
                      onClick={markAsRead}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    >
                      <MailOpen className="h-3.5 w-3.5 text-blue-600" />
                      Tandai sudah dibaca
                    </button>
                    <button
                      onClick={bulkArchive}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5 text-amber-600" />
                      Arsipkan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="-mb-px flex items-center gap-1 self-end">
              <button
                onClick={() => setActiveTab("utama")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "utama"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Utama
              </button>
              <button
                onClick={() => setActiveTab("notifikasi")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "notifikasi"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Shield className="h-4 w-4" />
                Notifikasi
              </button>
              <button
                onClick={() => setActiveTab("favorit")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "favorit"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Star className="h-4 w-4" />
                Favorit
              </button>
              <button
                onClick={() => setActiveTab("arsip")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "arsip"
                    ? "border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                }`}
              >
                <Archive className="h-4 w-4" />
                Arsip
              </button>
            </div>

            {/* Right Side: Account picker + Search */}
            <div className="ml-auto flex items-center gap-2 pb-2">
              <div className="relative">
                <Mail className="text-faint-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={isLoadingAccounts}
                  className="border-border bg-muted/60 text-foreground rounded-lg border py-1.5 pr-8 pl-9 text-xs font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-60"
                  aria-label="Pilih akun email"
                >
                  <option value="all">Semua akun</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.display_name || acc.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-64">
                <Search className="text-faint-foreground absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border bg-muted/60 text-foreground placeholder-placeholder w-full rounded-lg border py-1.5 pr-4 pl-10 text-xs font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                {activeTab === "arsip" ? (
                  <Archive className="text-faint-foreground h-8 w-8" />
                ) : (
                  <Inbox className="text-faint-foreground h-8 w-8" />
                )}
                <span className="text-muted-foreground text-sm font-medium">
                  {activeTab === "arsip" ? "Tidak ada email di arsip" : "Kotak masuk kosong"}
                </span>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`border-border flex cursor-pointer items-center border-b px-4 py-2 transition-colors hover:bg-slate-50 ${
                    email.isChecked ? "bg-blue-50/20" : ""
                  }`}
                >
                  {/* Check & Star */}
                  <div
                    className="mr-3 flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => toggleCheck(e, email.id)}
                      className="text-muted-foreground hover:text-foreground rounded transition-colors"
                    >
                      {email.isChecked ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => toggleStar(e, email.id)}
                      className={`rounded transition-colors ${
                        email.isStarred
                          ? "text-amber-500"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Star className="h-4 w-4" fill={email.isStarred ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Sender Name */}
                  <div
                    className={`w-40 shrink-0 truncate pr-4 text-sm ${
                      email.isRead
                        ? "text-muted-foreground font-medium"
                        : "text-foreground font-bold"
                    }`}
                  >
                    {email.sender}
                  </div>

                  {/* Subject & Snippet */}
                  <div className="min-w-0 flex-1 pr-4">
                    <span
                      className={`truncate text-sm ${
                        email.isRead
                          ? "text-muted-foreground font-medium"
                          : "text-foreground font-semibold"
                      }`}
                    >
                      {email.subject}
                    </span>
                    <span className="text-muted-foreground mx-2 text-xs font-semibold">—</span>
                    <span className="text-muted-foreground truncate text-xs font-medium">
                      {email.body}
                    </span>
                  </div>

                  {/* Time/Date */}
                  <div className="text-muted-foreground shrink-0 text-xs font-semibold whitespace-nowrap">
                    {email.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // EMAIL DETAIL VIEW
        <div className="bg-card flex flex-1 flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
            <button
              onClick={() => setSelectedEmail(null)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="ml-auto flex items-center gap-1">
              {selectedEmail.isArchived ? (
                <button
                  onClick={() => restoreEmail(selectedEmail)}
                  className="hover:bg-muted text-foreground rounded-lg p-1.5 transition-colors"
                  title="Pulihkan dari arsip"
                >
                  <ArchiveRestore className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => archiveEmail(selectedEmail)}
                  className="hover:bg-muted text-foreground rounded-lg p-1.5 transition-colors"
                  title="Arsipkan email"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDeleteEmail(selectedEmail)}
                disabled={isDeleting}
                className="text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-colors disabled:opacity-50"
                title="Hapus email"
              >
                <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          {/* Email Body */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-2xl space-y-6">
              {/* Subject */}
              <h2 className="text-foreground text-xl font-bold tracking-tight">
                {selectedEmail.subject}
              </h2>

              {/* Sender Details */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${selectedEmail.avatarBg}`}
                >
                  {selectedEmail.avatarText}
                </div>
                <div>
                  <div className="text-foreground text-sm font-bold">{selectedEmail.sender}</div>
                  <div className="text-muted-foreground text-xs font-medium">
                    &lt;{selectedEmail.senderEmail}&gt;
                  </div>
                </div>
                <div className="text-muted-foreground ml-auto text-xs font-semibold">
                  {selectedEmail.date}
                </div>
              </div>

              <hr className="border-border" />

              {/* OTP Card */}
              {selectedEmail.otp && (
                <div className="border-border-soft bg-muted/30 flex items-center justify-between rounded-xl border p-4 shadow-sm">
                  <div>
                    <div className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      One-Time Password (OTP)
                    </div>
                    <div className="text-foreground tracking-wides mt-1 font-mono text-2xl font-black">
                      {selectedEmail.otp}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-all active:scale-95 ${
                      copied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {/* Message Body */}
              <div className="text-foreground text-sm leading-relaxed font-semibold whitespace-pre-line">
                {selectedEmail.body}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
