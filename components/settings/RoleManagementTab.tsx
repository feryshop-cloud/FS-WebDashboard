"use client";

import React, { useState } from "react";
import { Shield, Key, Check, Loader2 } from "lucide-react";
import { updateRolePermissions } from "@/actions/settings";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions?: any;
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

export function RoleManagementTab({ roles, errorMsg, onRefresh }: RoleManagementTabProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const activePermissions: Record<string, boolean> =
    typeof selectedRole?.permissions === "object" && selectedRole?.permissions !== null
      ? selectedRole.permissions
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
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Daftar Role Sistem
          </h3>
          <div className="space-y-2">
            {roles.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white p-6 text-center text-xs text-slate-400">
                Belum ada data role di database.
              </div>
            ) : (
              roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r);
                    setSaveMessage("");
                  }}
                  className={`flex w-full flex-col rounded-xl border p-4 text-left transition-all ${
                    selectedRole?.id === r.id
                      ? "border-blue-500 bg-blue-50/50 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`h-4 w-4 ${
                        selectedRole?.id === r.id ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-900">{r.name}</span>
                  </div>
                  {r.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.description}</p>
                  )}
                </button>
              ))
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
    </div>
  );
}
