"use client";

import { useState, useEffect } from "react";
import { Users, FolderTree, Shield, RefreshCw, Gamepad2, Settings2 } from "lucide-react";
import {
  getCategories,
  getUsersList,
  getRolesList,
  getGamesList,
  getSiteSettings,
} from "@/actions/settings";
import { GameCategoryManager } from "@/components/features/GameCategoryManager";
import { GameManager } from "@/components/features/GameManager";
import { UserManagementTab } from "@/components/settings/UserManagementTab";
import { RoleManagementTab } from "@/components/settings/RoleManagementTab";
import { SiteSettingsTab } from "@/components/settings/SiteSettingsTab";
import type { Database } from "@/types/database.types";

type ActiveTab = "users" | "roles" | "categories" | "games" | "site";

type SiteSettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");

  const [categories, setCategories] = useState<unknown[]>([]);
  const [categoriesError, setCategoriesError] = useState<string>("");

  const [users, setUsers] = useState<unknown[]>([]);
  const [usersError, setUsersError] = useState<string>("");

  const [roles, setRoles] = useState<unknown[]>([]);
  const [rolesError, setRolesError] = useState<string>("");

  const [games, setGames] = useState<unknown[]>([]);
  const [gamesError, setGamesError] = useState<string>("");

  const [siteSettings, setSiteSettings] = useState<SiteSettingRow[]>([]);
  const [siteSettingsError, setSiteSettingsError] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [catRes, userRes, roleRes, gameRes, siteRes] = await Promise.all([
        getCategories(),
        getUsersList(),
        getRolesList(),
        getGamesList(),
        getSiteSettings(),
      ]);

      if (catRes.error) setCategoriesError(catRes.error);
      else setCategories(catRes.data || []);

      if (userRes.error) setUsersError(userRes.error);
      else setUsers(userRes.data || []);

      if (roleRes.error) setRolesError(roleRes.error);
      else setRoles(roleRes.data || []);

      if (gameRes.error) setGamesError(gameRes.error);
      else setGames(gameRes.data || []);

      if (siteRes.error) setSiteSettingsError(siteRes.error);
      else setSiteSettings((siteRes.data ?? []) as SiteSettingRow[]);
    } catch (err) {
      console.error("Error loading settings data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isMounted) {
        await loadData();
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

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
