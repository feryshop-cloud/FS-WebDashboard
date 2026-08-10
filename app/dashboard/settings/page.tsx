"use client";

import React from "react";
import { Users, FolderTree, Shield, RefreshCw, Gamepad2, Settings2 } from "lucide-react";
import { useSettings, ActiveTab } from "@/lib/hooks/features/useSettings";
import { GameCategoryManager } from "@/components/features/GameCategoryManager";
import { GameManager } from "@/components/features/GameManager";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { RoleManagementTab } from "@/components/settings/RoleManagementTab";
import { SiteSettingsTab } from "@/components/settings/SiteSettingsTab";
import type { Database } from "@/types/database.types";

export default function SettingsPage() {
  const {
    data: { categories, users, roles, games, siteSettings },
    errors: { categoriesError, usersError, rolesError, gamesError, siteSettingsError },
    isLoading,
    uiState: { activeTab },
    actions: { setActiveTab, loadData },
  } = useSettings();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Manajemen User", icon: <Users className="h-5 w-5" /> },
    { id: "roles", label: "Hak Akses / Role", icon: <Shield className="h-5 w-5" /> },
    { id: "games", label: "Master Game", icon: <Gamepad2 className="h-5 w-5" /> },
    { id: "categories", label: "Kategori", icon: <FolderTree className="h-5 w-5" /> },
    { id: "site", label: "Pengaturan Situs", icon: <Settings2 className="h-5 w-5" /> },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Konfigurasi user, role & hak akses, master game, dan kategori Feryshop.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="bg-muted text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-1 lg:col-span-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "border border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
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

          {activeTab === "games" && (
            <GameManager
              initialGames={
                (games as unknown as Database["public"]["Tables"]["games"]["Row"][]) || []
              }
              errorMsg={gamesError ? `Gagal memuat game: ${gamesError}` : undefined}
            />
          )}

          {activeTab === "categories" && (
            <GameCategoryManager
              initialCategories={
                (categories as unknown as Database["public"]["Tables"]["categories"]["Row"][]) || []
              }
              errorMsg={categoriesError ? `Gagal memuat kategori: ${categoriesError}` : undefined}
            />
          )}

          {activeTab === "site" && (
            <SiteSettingsTab
              settings={siteSettings}
              errorMsg={
                siteSettingsError
                  ? `Gagal memuat pengaturan situs: ${siteSettingsError}`
                  : undefined
              }
              onRefresh={loadData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
