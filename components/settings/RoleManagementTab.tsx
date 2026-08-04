"use client";

import React, { useState } from "react";
import { Shield, Key, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { updateRolePermissions, createRole, deleteRole } from "@/actions/settings";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions?: unknown;
};

interface RoleManagementTabProps {
  roles: Role[];
  errorMsg?: string;
  onRefresh: () => void;
}

const DEFAULT_PERMISSIONS_KEYS = [
  { key: "inventory.view", label: "Lihat Stok Akun" },
  { key: "inventory.create", label: "Tambah Stok Akun" },
  { key: "inventory.edit", label: "Edit Stok Akun" },
  { key: "inventory.delete", label: "Hapus Stok Akun" },
  { key: "topup.manage", label: "Kelola Produk Topup" },
  { key: "deals.manage", label: "Kelola Transaksi Deals" },
  { key: "settings.access", label: "Akses Pengaturan Sistem" },
];

const SYSTEM_ROLES = ["OWNER", "ADMIN", "MEMBER"];

export function RoleManagementTab({ roles, errorMsg, onRefresh }: RoleManagementTabProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // Modal State for New Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const activePermissions: Record<string, boolean> =
    typeof selectedRole?.permissions === "object" && selectedRole?.permissions !== null
      ? (selectedRole.permissions as Record<string, boolean>)
      : {};

  const handleTogglePermission = (key: string) => {
    if (!selectedRole) return;
    const updated = {
      ...activePermissions,
      [key]: !activePermissions[key],
    };
    setSelectedRole({
      ...selectedRole,
      permissions: updated,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSaving(true);
      setSaveMessage("");
      const res = await updateRolePermissions(selectedRole.id, activePermissions);

      if (res.success) {
        setSaveMessage("Hak akses berhasil disimpan!");
        onRefresh();
      } else {
        setSaveMessage(res.error || "Gagal menyimpan hak akses.");
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newRoleName.trim()) {
      setFormError("Nama role wajib diisi.");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createRole(newRoleName, newRoleDesc);
      if (!res.success) {
        setFormError(res.error || "Gagal membuat role.");
        return;
      }

      setIsModalOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
      onRefresh();
    } catch (err) {
      console.error(err);
      setFormError("Gagal membuat role baru.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role ${roleName}?`)) return;

    try {
      const res = await deleteRole(roleId);
      if (!res.success) {
        setSaveMessage(res.error || "Gagal menghapus role.");
        return;
      }

      if (selectedRole?.id === roleId) {
        setSelectedRole(roles.find((r) => r.id !== roleId) || null);
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Roles List */}
        <div className="space-y-3 md:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Daftar Role Sistem
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Role
            </button>
          </div>

          <div className="space-y-2">
            {roles.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-400">
                Belum ada data role di database.
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                const isSystem = SYSTEM_ROLES.includes(r.name.toUpperCase());

                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedRole(r);
                      setSaveMessage("");
                    }}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Shield
                          className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`}
                        />
                        <span className="text-sm font-bold text-slate-900">{r.name}</span>
                        {isSystem && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            Sistem
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.description}</p>
                      )}
                    </div>

                    {!isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(r.id, r.name);
                        }}
                        title="Hapus Role Custom"
                        className="opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100 text-slate-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="md:col-span-8">
          {selectedRole ? (
            <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Key className="h-5 w-5 text-blue-600" />
                    Hak Akses: {selectedRole.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedRole.description || "Konfigurasi izin fitur untuk role ini."}
                  </p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Simpan Akses
                </button>
              </div>

              {saveMessage && (
                <div
                  className={`rounded-lg p-3 text-xs font-medium ${
                    saveMessage.includes("berhasil")
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {saveMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DEFAULT_PERMISSIONS_KEYS.map((perm) => {
                  const isChecked = !!activePermissions[perm.key];
                  return (
                    <div
                      key={perm.key}
                      onClick={() => handleTogglePermission(perm.key)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? "border-blue-200 bg-blue-50/30 text-blue-900"
                          : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-medium">{perm.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-white p-12 text-center text-sm text-slate-400">
              Pilih role di sebelah kiri untuk mengatur hak akses.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Role Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="misal: STAFF_FINANCE, CS_OFFICER"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan tugas atau tanggung jawab role ini..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
