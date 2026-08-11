"use client";

import React, { useState } from "react";
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  SearchX,
  Command,
  Loader2,
  Wand2,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useUserManagement,
  type UserRecord,
  type Role,
} from "@/lib/hooks/features/useUserManagement";

interface UserManagementTabProps {
  users: UserRecord[];
  roles: Role[];
  errorMsg?: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function UserManagementTab({
  users,
  roles,
  errorMsg,
  onRefresh,
  isLoading = false,
}: UserManagementTabProps) {
  const {
    data: { filteredUsers },
    isCreating,
    updatingUserId,
    formError,
    actionError,
    createdUser,
    uiState: { searchQuery, isModalOpen, isModalClosing, form },
    refs: { searchInputRef },
    actions: {
      setSearchQuery,
      setForm,
      openModal,
      closeModal,
      handleRoleChange,
      handleToggleStatus,
      handleCreateUser,
      handleGeneratePassword,
      handleCopyPassword,
    },
  } = useUserManagement(users, onRefresh);

  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onCopy = async () => {
    await handleCopyPassword();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <div className="group relative">
            <Search
              className={`absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 transition-colors ${searchQuery ? "text-blue-600" : "text-faint-foreground group-focus-within:text-blue-600"}`}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama, email, user ID, atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchQuery("");
                  searchInputRef.current?.blur();
                }
              }}
              className="border-border bg-card placeholder:text-faint-foreground hover:border-input w-full rounded-xl border py-2.5 pr-24 pl-10 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
            />
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  title="Hapus kata kunci (Esc)"
                  className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-md p-1 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="border-border bg-muted text-faint-foreground hidden items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="border-border-soft bg-card overflow-hidden rounded-2xl border shadow-sm">
        {(errorMsg || actionError) && (
          <div className="border-b border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {errorMsg || actionError}
          </div>
        )}

        {/* Filter Result Summary */}
        {searchQuery.trim() !== "" && (
          <div className="border-border-soft bg-muted/50 text-muted-foreground flex items-center justify-between border-b px-6 py-2.5 text-xs">
            <span>
              Menampilkan{" "}
              <strong className="text-foreground font-semibold">{filteredUsers.length}</strong> dari{" "}
              <strong className="text-foreground font-semibold">{users.length}</strong> pengguna
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="font-medium text-blue-600 hover:underline"
            >
              Bersihkan filter
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="text-muted-foreground w-full text-left text-sm">
            <thead className="border-border-soft bg-muted/70 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
              <tr>
                <th className="px-6 py-3.5">Pengguna / ID</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Aksi / Ubah Role</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                      <span className="text-muted-foreground mt-1 text-xs">
                        Memuat data pengguna...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="bg-muted text-faint-foreground rounded-full p-3">
                        <SearchX className="h-6 w-6" />
                      </div>
                      <p className="text-foreground text-sm font-semibold">
                        {searchQuery
                          ? `Tidak ada pengguna yang cocok dengan "${searchQuery}"`
                          : "Belum ada pengguna ditemukan"}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="border-border bg-card text-foreground hover:bg-muted mt-1 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-semibold">{user.full_name}</span>
                        <span className="text-faint-foreground font-mono text-xs">{user.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <Shield className="h-3 w-3" />
                        {user.roles?.name || "Belum ada role"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={updatingUserId === user.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                          user.status === "ACTIVE" || !user.status
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-border bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {user.status === "ACTIVE" || !user.status ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="text-faint-foreground h-3 w-3" />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={user.role_id || ""}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingUserId === user.id}
                        className="border-border bg-card text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">-- Pilih Role --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {(isModalOpen || isModalClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm ${
            isModalClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card border-border-soft flex h-full w-full max-w-md flex-col border-l shadow-2xl ${
              isModalClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-foreground text-base font-bold">Tambah Pengguna Baru</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Buat akun pengguna dengan mengisi data berikut.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isCreating}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              {createdUser ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-base font-bold">
                      Pengguna Berhasil Dibuat
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Akun untuk{" "}
                      <span className="text-foreground font-semibold">{createdUser.full_name}</span>{" "}
                      ({createdUser.email}) sudah aktif.
                    </p>
                  </div>

                  {createdUser.generatedPassword && (
                    <div className="border-border bg-muted w-full max-w-xs rounded-xl border p-4 text-left">
                      <p className="text-muted-foreground text-xs font-semibold">
                        Password otomatis (simpan & bagikan ke pengguna):
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="border-border-soft bg-card text-foreground flex-1 rounded-lg border px-3 py-2 font-mono text-sm font-semibold tracking-wide">
                          {createdUser.generatedPassword}
                        </code>
                        <button
                          type="button"
                          onClick={onCopy}
                          title="Salin password"
                          className="border-border-soft bg-card text-muted-foreground hover:text-foreground hover:border-input rounded-lg border p-2 transition-colors"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-faint-foreground mt-2 text-[11px]">
                        Password hanya ditampilkan sekali setelah pembuatan.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Selesai
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {formError && (
                      <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {formError}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="new-user-name"
                        className="text-muted-foreground text-xs font-semibold"
                      >
                        Nama Lengkap
                      </label>
                      <input
                        id="new-user-name"
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Nama lengkap pengguna"
                        className="border-border rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="new-user-email"
                        className="text-muted-foreground text-xs font-semibold"
                      >
                        Email
                      </label>
                      <input
                        id="new-user-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="nama@perusahaan.com"
                        className="border-border rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="new-user-password"
                        className="text-muted-foreground text-xs font-semibold"
                      >
                        Password <span className="font-normal">(opsional)</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id="new-user-password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Kosongkan untuk digenerate otomatis"
                            minLength={6}
                            className="border-border w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            title={showPassword ? "Sembunyikan password" : "Lihat password"}
                            className="text-faint-foreground hover:text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          title="Generate password otomatis"
                          className="border-border bg-muted text-muted-foreground hover:text-foreground hover:border-input inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <Wand2 className="h-3.5 w-3.5 text-blue-600" />
                          Auto
                        </button>
                      </div>
                      <p className="text-faint-foreground text-[11px]">
                        Jika dikosongkan, password akan digenerate otomatis dan ditampilkan sekali
                        setelah pengguna dibuat.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="new-user-role"
                        className="text-muted-foreground text-xs font-semibold"
                      >
                        Role
                      </label>
                      <select
                        id="new-user-role"
                        value={form.role_id}
                        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                        className="border-border bg-card rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      >
                        <option value="">-- Pilih Role --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-border-soft bg-card border-t p-6">
                    <div className="flex w-full flex-col gap-2">
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCreating ? "Membuat..." : "Buat Pengguna"}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={isCreating}
                        className="text-muted-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
