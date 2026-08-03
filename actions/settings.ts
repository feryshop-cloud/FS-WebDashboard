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
  const { createAdminClient } = await import("../lib/supabase/admin");
  const supabase = createAdminClient();

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

