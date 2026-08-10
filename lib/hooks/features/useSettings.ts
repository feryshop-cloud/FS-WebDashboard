import { useState, useEffect, useTransition } from "react";
import {
  getCategories,
  getUsersList,
  getRolesList,
  getGamesList,
  getSiteSettings,
} from "@/actions/settings";

export type ActiveTab = "users" | "roles" | "categories" | "games" | "site";

export type SiteSettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

export function useSettings() {
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
  const [, startTransition] = useTransition();

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
    let active = true;
    Promise.all([
      getCategories(),
      getUsersList(),
      getRolesList(),
      getGamesList(),
      getSiteSettings(),
    ])
      .then(([catRes, userRes, roleRes, gameRes, siteRes]) => {
        if (!active) return;
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
      })
      .catch((err) => {
        console.error("Error loading settings data:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    data: {
      categories,
      users,
      roles,
      games,
      siteSettings,
    },
    errors: {
      categoriesError,
      usersError,
      rolesError,
      gamesError,
      siteSettingsError,
    },
    isLoading,
    uiState: {
      activeTab,
    },
    actions: {
      setActiveTab,
      loadData: () => startTransition(() => loadData()),
    },
  };
}
