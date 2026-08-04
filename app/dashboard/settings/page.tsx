"use client";

import React, { useState, useEffect } from "react";
import { Users, FolderTree, Shield, RefreshCw } from "lucide-react";
import { getCategories, getUsersList, getRolesList } from "@/actions/settings";
import { GameCategoryManager } from "@/components/features/GameCategoryManager";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { RoleManagementTab } from "@/components/settings/RoleManagementTab";
import type { Database } from "@/types/database.types";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "categories">("users");

  const [categories, setCategories] = useState<unknown[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>("");

  const [users, setUsers] = useState<unknown[]>([]);
  const [usersError, setUsersError] = useState<string>("");

  const [roles, setRoles] = useState<unknown[]>([]);
  const [rolesError, setRolesError] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catRes, userRes, roleRes] = await Promise.all([
        getCategories(),
        getUsersList(),
        getRolesList(),
      ]);

      if (catRes.error) setCategoriesError(catRes.error);
      else setCategories(catRes.data || []);

      if (userRes.error) setUsersError(userRes.error);
      else setUsers(userRes.data || []);

      if (roleRes.error) setRolesError(roleRes.error);
      else setRoles(roleRes.data || []);
    } catch (err) {
      console.error("Error loading settings data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Konfigurasi user, role & hak akses, dan data master kategori Feryshop.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2 lg:col-span-3">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "border border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="h-5 w-5" /> Manajemen User
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeTab === "roles"
                ? "border border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Shield className="h-5 w-5" /> Hak Akses / Role
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              activeTab === "categories"
                ? "border border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FolderTree className="h-5 w-5" /> Kategori
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6 lg:col-span-9">
          {activeTab === "users" && (
            <UserManagementTab
              users={users as never}
              roles={roles as never}
              errorMsg={usersError ? `Gagal memuat pengguna: ${usersError}` : undefined}
              onRefresh={loadData}
            />
          )}

          {activeTab === "roles" && (
            <RoleManagementTab
              roles={roles as never}
              errorMsg={rolesError ? `Gagal memuat role: ${rolesError}` : undefined}
              onRefresh={loadData}
            />
          )}

          {activeTab === "categories" && (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <h2 className="text-base font-bold text-slate-800">Master Kategori Game</h2>
              </div>
              <div className="p-6">
                <GameCategoryManager
                  initialCategories={
                    (categories as unknown as Database["public"]["Tables"]["categories"]["Row"][]) ||
                    []
                  }
                  errorMsg={
                    categoriesError ? `Gagal memuat kategori: ${categoriesError}` : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
