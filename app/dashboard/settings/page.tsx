import React from "react";
import { Users, FolderTree, Shield } from "lucide-react";
import { getCategories, getUsersList } from "@/actions/settings";
import { GameCategoryManager } from "@/components/features/GameCategoryManager";
import type { Database } from "@/types/database.types";

export default async function SettingsPage() {
  const { data: categories, error: categoriesError } = await getCategories();
  const { data: usersList, error: usersError } = await getUsersList();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Konfigurasi user, role, dan data master sistem Feryshop.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2 lg:col-span-3">
          <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            <Users className="h-5 w-5" /> Manajemen User
          </button>
          <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            <Shield className="h-5 w-5" /> Hak Akses / Role
          </button>
          <button className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 transition-colors">
            <FolderTree className="h-5 w-5" /> Kategori
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6 lg:col-span-9">
          {/* USER MANAGEMENT SECTION */}
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-base font-bold text-slate-800">Daftar Pengguna (Admin)</h2>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                <Users className="h-3 w-3" /> Tambah Admin
              </button>
            </div>
            <div className="p-0">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Nama & Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usersList && usersList.length > 0 ? (
                    usersList.map((userRecord: any) => (
                      <tr key={userRecord.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">
                              {userRecord.full_name || "Admin"}
                            </span>
                            <span className="text-xs text-slate-500">{userRecord.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {userRecord.roles?.name || "Admin"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              userRecord.status === "Aktif"
                                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {userRecord.status || "Aktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                        {usersError ? `Gagal memuat pengguna: ${usersError}` : "Belum ada data pengguna terdaftar."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CATEGORIES SECTION */}
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-base font-bold text-slate-800">Master Kategori</h2>
            </div>
            <div className="p-6">
              <GameCategoryManager
                initialCategories={(categories as unknown as Database["public"]["Tables"]["categories"]["Row"][]) || []}
                errorMsg={categoriesError ? `Gagal memuat kategori: ${categoriesError}` : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

