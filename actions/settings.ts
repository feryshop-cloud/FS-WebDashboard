"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGameCategory(title: string, game_slug: string, logo?: string) {
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
    console.error("Database Error:", error);
    return { success: false, error: "Gagal menambahkan kategori." };
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
    console.error("Database Error:", error);
    return { success: false, error: "Gagal mengupdate kategori." };
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

  const { error } = await supabase
    .from("categories")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    console.error("Database Error:", error);
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
    console.error("[deleteGameCategory] DB Error:", error.message, error.code, error.details);
    return { success: false, error: `Gagal menghapus: ${error.message}` };
  }

  console.log(`[deleteGameCategory] Deleted category id=${id}, rows returned:`, data?.length ?? 0);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/inventory");

  return { success: true };
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, title, game_slug, logo, is_active, sort_order, created_at")
    .order("title");

  if (error) {
    console.error("Error fetching categories:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getUsersList() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, is_active, role_id, created_at, roles(id, name, description)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
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
    console.error("Error fetching roles:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createAdminUser(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const full_name = formData.get("full_name") as string;
  const role_id = formData.get("role_id") as string;

  if (!id || !full_name) {
    return { success: false, error: "ID (User ID/Email) dan Nama Lengkap wajib diisi." };
  }

  const { error } = await supabase.from("users").insert({
    id,
    full_name,
    email: id.includes("@") ? id : `${id}@feryshop.com`,
    role_id: role_id || null,
    status: "Aktif",
  });

  if (error) {
    console.error("Database Error creating user:", error);
    return { success: false, error: error.message || "Gagal membuat pengguna." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
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
    console.error("Database Error updating user role:", error);
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

  const newStatus = currentStatus === "Aktif" ? "Nonaktif" : "Aktif";

  const { error } = await supabase
    .from("users")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Database Error toggling user status:", error);
    return { success: false, error: error.message || "Gagal mengubah status pengguna." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
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
    console.error("Database Error updating role permissions:", error);
    return { success: false, error: error.message || "Gagal meng-update hak akses role." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}


