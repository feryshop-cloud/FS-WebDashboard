"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Shield,
  Inbox,
  Square,
  CheckSquare,
  RefreshCw,
  MoreVertical,
  Star,
  Mail,
  MailOpen,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { useFerryMail } from "@/lib/hooks/features/useFerryMail";

export default function FerryMailPage() {
  const router = useRouter();
  const {
    data: { filteredEmails, pageItems, totalFiltered, totalPages, currentPage, accounts, isLoadingAccounts },
    uiState: {
      searchQuery,
      activeTab,
      allFilteredChecked,
      selectedAccountId,
      isDeleting,
      checkedCount,
      openMenu,
      allCheckedArchived,
    },
    refs: { menuRef },
    actions: {
      setSearchQuery,
      setActiveTab,
      setSelectedAccountId,
      setCurrentPage,
      toggleCheck,
      toggleStar,
      toggleAllChecks,
      reloadInbox,
      handleBulkDelete,
      markAsRead,
      setOpenMenu,
      bulkToggleArchive,
    },
  } = useFerryMail();

  return (
    <div className="border-border bg-card -mx-8 -my-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden border-t font-sans select-none">
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
                    onClick={bulkToggleArchive}
                    className="hover:bg-muted text-foreground rounded p-1 transition-colors"
                    title={
                      allCheckedArchived
                        ? `Keluarkan ${checkedCount} email dari arsip`
                        : `Arsipkan ${checkedCount} email`
                    }
                  >
                    {allCheckedArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
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
                      onClick={bulkToggleArchive}
                      className="text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    >
                      {allCheckedArchived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5 text-amber-600" />
                          Keluarkan dari arsip
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5 text-amber-600" />
                          Arsipkan
                        </>
                      )}
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

            {/* Right Side: Pager + Account picker + Search */}
            <div className="ml-auto flex items-center gap-2 pb-2">
              {/* Compact pager */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="text-muted-foreground hover:bg-muted disabled:opacity-30 rounded p-1 transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  </button>
                  <span className="text-muted-foreground min-w-[48px] text-center text-xs font-semibold tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="text-muted-foreground hover:bg-muted disabled:opacity-30 rounded p-1 transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  </button>
                  <span className="text-faint-foreground text-xs tabular-nums">({totalFiltered})</span>
                </div>
              )}
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
              pageItems.map((email) => (
                <div
                  key={email.id}
                  onClick={() => router.push(`/dashboard/ferrymail/${email.id}`)}
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
      </div>
  );
}
