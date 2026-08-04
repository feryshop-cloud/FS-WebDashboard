"use client";

import React, { useState } from "react";
import { Users, Plus, Search, Loader2, X, Shield, CheckCircle2, XCircle } from "lucide-react";
import { createAdminUser, updateUserRole, toggleUserStatus } from "@/actions/settings";

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

export function UserManagementTab({
  users,
  roles,
  errorMsg,
  onRefresh,
}: UserManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roles?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setModalError("");
      const formData = new FormData(e.currentTarget);
      const res = await createAdminUser(formData);

      if (res.success) {
        setIsAddModalOpen(false);
        onRefresh();
      } else {
        setModalError(res.error || "Gagal menambahkan user.");
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      setUpdatingUserId(userId);
      await updateUserRole(userId, newRoleId);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string | null) => {
    try {
      setUpdatingUserId(userId);
      await toggleUserStatus(userId, currentStatus || "Aktif");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, user ID, atau role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Admin Baru
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        {errorMsg && (
          <div className="border-b border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMsg}
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
                          user.status === "Aktif" || !user.status
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {user.status === "Aktif" || !user.status ? (
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

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Admin / Pengguna Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full bg-white p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 p-6 text-sm">
              {modalError && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-600">
                  {modalError}
                </div>
              )}

              <div>
                <label className="mb-1 block font-medium text-slate-700">User ID / Email</label>
                <input
                  name="id"
                  type="text"
                  required
                  placeholder="e.g. admin@feryshop.com or UUID"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Nama Lengkap</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Role Sistem</label>
                <select
                  name="role_id"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">-- Tanpa Role Spesifik --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.description || "No desc"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
