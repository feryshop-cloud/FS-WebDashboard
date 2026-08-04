"use client";

import React, { useState } from "react";
import { Search, Shield, CheckCircle2, XCircle, Plus, X } from "lucide-react";
import { updateUserRole, toggleUserStatus, createAdminUser } from "@/actions/settings";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

type UserRecord = {
  id: string;
  full_name: string;
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
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
  });

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roles?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
    setIsCreating(true);
    try {
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
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, user ID, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna Baru
          </button>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">
            Buat akun admin/staff baru langsung dari sini (terpisah dari proses web storefront).
            Pengguna non-admin tetap dibuat otomatis saat login/signup pertama.
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {(errorMsg || actionError) && (
          <div className="border-b border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {errorMsg || actionError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Pengguna / ID</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Aksi / Ubah Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{user.full_name}</span>
                        <span className="font-mono text-xs text-slate-400">{user.id}</span>
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
                            : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {user.status === "ACTIVE" || !user.status ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-slate-400" />
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
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
          <div className="relative w-full max-w-md rounded-xl border border-slate-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
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
                <label htmlFor="new-user-name" className="text-xs font-semibold text-slate-600">
                  Nama Lengkap
                </label>
                <input
                  id="new-user-name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nama lengkap pengguna"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-email" className="text-xs font-semibold text-slate-600">
                  Email
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@perusahaan.com"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-password" className="text-xs font-semibold text-slate-600">
                  Password
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-user-role" className="text-xs font-semibold text-slate-600">
                  Role
                </label>
                <select
                  id="new-user-role"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
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
