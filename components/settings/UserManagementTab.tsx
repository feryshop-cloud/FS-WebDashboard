"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Shield, CheckCircle2, XCircle, Plus, X, SearchX, Command } from "lucide-react";
import { updateUserRole, toggleUserStatus, createAdminUser } from "@/actions/settings";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

type UserRecord = {
  id: string;
  full_name: string;
  email?: string | null;
  status: string | null;
  role_id: string | null;
  created_at: string;
  roles?: { id: string; name: string; description: string | null } | null;
};

interface UserManagementTabProps {
  users: UserRecord[];
  roles: Role[];
  errorMsg?: string;
  onRefresh: () => void;
}

export function UserManagementTab({ users, roles, errorMsg, onRefresh }: UserManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
  });

  // Global Keyboard Shortcut: '/' or 'Ctrl+K' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement !== searchInputRef.current
      ) {
        // Prevent typing '/' into input when focusing
        const isInputOrTextarea = ["INPUT", "TEXTAREA"].includes(
          (document.activeElement?.tagName || "").toUpperCase(),
        );
        if (!isInputOrTextarea) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const queryLower = searchQuery.trim().toLowerCase();

  const filteredUsers = users.filter((u) => {
    if (!queryLower) return true;
    return (
      u.full_name?.toLowerCase().includes(queryLower) ||
      u.email?.toLowerCase().includes(queryLower) ||
      u.id?.toLowerCase().includes(queryLower) ||
      u.roles?.name?.toLowerCase().includes(queryLower) ||
      u.status?.toLowerCase().includes(queryLower)
    );
  });

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setActionError("");
    try {
      setUpdatingUserId(userId);
      const res = await updateUserRole(userId, newRoleId);
      if (res && !res.success) {
        setActionError(res.error || "Gagal mengubah role pengguna.");
        return;
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError("Gagal mengubah role pengguna.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string | null) => {
    setActionError("");
    try {
      setUpdatingUserId(userId);
      const res = await toggleUserStatus(userId, currentStatus || "ACTIVE");
      if (res && !res.success) {
        setActionError(res.error || "Gagal mengubah status pengguna.");
        return;
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionError("Gagal mengubah status pengguna.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.email || !form.password || !form.full_name) {
      setFormError("Email, password, dan nama lengkap wajib diisi.");
      return;
    }
    try {
      setIsCreating(true);
      const res = await createAdminUser(
        form.email,
        form.password,
        form.full_name,
        form.role_id || null,
      );
      if (!res.success) {
        setFormError(res.error || "Gagal membuat pengguna.");
        return;
      }
      setIsModalOpen(false);
      setForm({ email: "", password: "", full_name: "", role_id: "" });
      onRefresh();
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan saat membuat pengguna.");
    } finally {
      setIsCreating(false);
    }
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
              className="w-full rounded-xl border border-border bg-card py-2.5 pr-24 pl-10 text-sm shadow-sm transition-all placeholder:text-faint-foreground hover:border-input focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
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
                  className="rounded-md p-1 text-faint-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-faint-foreground sm:inline-flex">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna Baru
          </button>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs leading-relaxed text-blue-700">
            Pengguna non-admin tetap dibuat otomatis saat login/signup pertama.
          </div>
        </div>
      </div>

      {/* Users Table Container */}
      <div className="overflow-hidden rounded-2xl border border-border-soft bg-card shadow-sm">
        {(errorMsg || actionError) && (
          <div className="border-b border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {errorMsg || actionError}
          </div>
        )}

        {/* Filter Result Summary */}
        {searchQuery.trim() !== "" && (
          <div className="flex items-center justify-between border-b border-border-soft bg-muted/50 px-6 py-2.5 text-xs text-muted-foreground">
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-foreground">{filteredUsers.length}</strong> dari{" "}
              <strong className="font-semibold text-foreground">{users.length}</strong> pengguna
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
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="border-b border-border-soft bg-muted/70 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Pengguna / ID</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Aksi / Ubah Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-muted p-3 text-faint-foreground">
                        <SearchX className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {searchQuery
                          ? `Tidak ada pengguna yang cocok dengan "${searchQuery}"`
                          : "Belum ada pengguna ditemukan"}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="mt-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.full_name}</span>
                        <span className="font-mono text-xs text-faint-foreground">{user.id}</span>
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
                            <XCircle className="h-3 w-3 text-faint-foreground" />
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
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => !isCreating && setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border-soft bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <h3 className="text-base font-bold text-foreground">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="rounded-lg p-1 text-faint-foreground transition-colors hover:bg-muted hover:text-muted-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 p-6">
              {formError && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-name" className="text-xs font-semibold text-muted-foreground">
                  Nama Lengkap
                </label>
                <input
                  id="new-user-name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nama lengkap pengguna"
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-email" className="text-xs font-semibold text-muted-foreground">
                  Email
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@perusahaan.com"
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-password" className="text-xs font-semibold text-muted-foreground">
                  Password
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-role" className="text-xs font-semibold text-muted-foreground">
                  Role
                </label>
                <select
                  id="new-user-role"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">-- Pilih Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? "Membuat..." : "Buat Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
