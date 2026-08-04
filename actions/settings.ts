"use server";

import { logger } from "@/lib/logger";
import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGameCategory(
  title: string,
  game_slug: string,
  logo?: string,
  instructions?: any[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!title || !game_slug) {
    return { success: false, error: "Title and Game Slug are required." };
  }

  // Update categories table
  const { data, error } = await supabase
    .from("categories")
    .insert({
      title,
      game_slug,
      logo: logo || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error("Database Error", { error });
    return { success: false, error: "Gagal menambahkan kategori." };
  }

  // Also update instructions in games table if exists
  if (instructions) {
    await supabase.from("games").update({ instructions }).eq("slug", game_slug);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/inventory");

  return { success: true, data };
}

export async function updateGameCategory(
  id: number,
  title: string,
  game_slug: string,
  logo?: string,
  is_active: boolean = true,
  instructions?: any[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!id || !title || !game_slug) {
    return { success: false, error: "ID, Title, and Game Slug are required." };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      title,
      game_slug,
      logo: logo || null,
      is_active,
    })
    .eq("id", id);

  if (error) {
    logger.error("Database Error", { error });
    return { success: false, error: "Gagal mengupdate kategori." };
  }

  // Update instructions in games table
  if (instructions) {
    await supabase.from("games").update({ instructions }).eq("slug", game_slug);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/inventory");

  return { success: true };
}

export async function toggleGameCategoryStatus(id: number, is_active: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("categories").update({ is_active }).eq("id", id);

  if (error) {
    logger.error("Database Error", { error });
    return { success: false, error: "Gagal mengubah status kategori." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/inventory");

  return { success: true };
}

export async function deleteGameCategory(id: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!id) {
    return { success: false, error: "ID is required." };
  }

  const { error, data } = await supabase.from("categories").delete().eq("id", id).select();

  if (error) {
    logger.error("[deleteGameCategory] DB Error", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return { success: false, error: `Gagal menghapus: ${error.message}` };
  }

  logger.info(`[deleteGameCategory] Deleted category id=${id}, rows returned`, {
    count: data?.length ?? 0,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/inventory");

  return { success: true };
}

export async function getGameInstructions(game_slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("instructions")
    .eq("slug", game_slug)
    .maybeSingle();

  if (error) {
    logger.error("[getGameInstructions] Error fetching instructions", { error });
    return { data: null, error: error.message };
  }

  return { data: (data?.instructions as any[]) || null, error: null };
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, title, game_slug, logo, is_active, sort_order, created_at")
    .order("title");

  if (error) {
    logger.error("Error fetching categories", { error });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getUsersList() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, status, role_id, created_at, roles(id, name, description)")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching users", { error });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getRolesList() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, permissions, created_at")
    .order("name");

  if (error) {
    logger.error("Error fetching roles", { error });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateUserRole(userId: string, roleId: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      role_id: roleId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    logger.error("Database Error updating user role", { error });
    return { success: false, error: error.message || "Gagal meng-update role pengguna." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const { error } = await supabase
    .from("users")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    logger.error("Database Error toggling user status", { error });
    return { success: false, error: error.message || "Gagal mengubah status pengguna." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function createAdminUser(
  email: string,
  password: string,
  full_name: string,
  role_id: string | null,
) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  if (!email || !password || !full_name) {
    return { success: false, error: "Email, password, dan nama lengkap wajib diisi." };
  }

  const { data, error } = await supabase.functions.invoke<{
    id?: string;
    error?: string;
  }>("admin-create-user", {
    body: { email, password, full_name, role_id: role_id || null },
  });

  if (error) {
    let message = "Gagal membuat pengguna.";
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = await ctx.json();
        message = body?.error ?? message;
      } catch {
        // ignore non-JSON error body
      }
    }
    logger.error("[createAdminUser] Error", { error });
    return { success: false, error: message };
  }

  if (!data?.id) {
    logger.error("[createAdminUser] No user id returned", { data });
    return { success: false, error: "Gagal membuat pengguna." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, data: { id: data.id } };
}

export async function updateRolePermissions(roleId: string, permissions: Record<string, boolean>) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("roles")
    .update({
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roleId);

  if (error) {
    logger.error("Database Error updating role permissions", { error });
    return { success: false, error: error.message || "Gagal meng-update hak akses role." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
