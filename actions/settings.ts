"use server";

import { logger } from "@/lib/logger";
import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database, Json } from "@/types/database.types";

export async function addGameCategory(
  title: string,
  game_slug: string,
  logo?: string,
  instructions?: Json,
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
    await supabase
      .from("games")
      .update({ instructions: instructions as Json })
      .eq("slug", game_slug);
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
  instructions?: Json,
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
    await supabase
      .from("games")
      .update({ instructions: instructions as Json })
      .eq("slug", game_slug);
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

  return { data: (data?.instructions as unknown[]) || null, error: null };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "game"
  );
}

async function resolveGameSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  preferred?: string,
  excludeId?: string,
): Promise<string> {
  const trimmed = preferred?.trim();
  const base = trimmed ? trimmed : slugify(name);

  let query = supabase.from("games").select("slug").ilike("slug", `${base}%`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;

  const taken = new Set((data ?? []).map((row) => row.slug));

  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export async function getGamesList() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, name, slug, logo, image_url, is_active, is_popular, sort_order, instructions, created_at",
    )
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("[getGamesList] Error fetching games", { error });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function addGame(name: string, slug: string, logo?: string, instructions?: unknown[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!name) return { success: false, error: "Nama game wajib diisi." };

  const finalSlug = await resolveGameSlug(supabase, name, slug);

  const mappedInputFields =
    instructions && Array.isArray(instructions)
      ? (instructions as Record<string, unknown>[]).map((f) => ({
          name: (f.name as string) || (f.id as string) || "field",
          type: (f.type as string) || "text",
          label: (f.label as string) || (f.name as string) || "Field",
          placeholder: (f.placeholder as string) || "",
        }))
      : [];

  const finalInstructions = {
    fields: instructions || [],
    input_fields: mappedInputFields,
    required_inputs: mappedInputFields.map((i) => i.name),
  };

  const { data, error } = await supabase
    .from("games")
    .insert({
      name,
      slug: finalSlug,
      logo: logo || null,
      instructions: finalInstructions as Json,
      is_active: true,
      code: null as any,
    })
    .select()
    .single();

  if (error) {
    logger.error("[addGame] DB Error", { error });
    return { success: false, error: error.message || "Gagal menambahkan game." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/topup-products");
  return { success: true, data };
}

export async function updateGame(
  id: string,
  name: string,
  slug: string,
  logo?: string,
  is_active?: boolean,
  is_popular?: boolean,
  instructions?: unknown[],
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!id || !name) return { success: false, error: "ID dan nama wajib diisi." };

  const finalSlug = await resolveGameSlug(supabase, name, slug, id);

  const updatePayload: Database["public"]["Tables"]["games"]["Update"] = {
    name,
    slug: finalSlug,
    logo: logo || null,
    is_active: is_active ?? true,
    is_popular: is_popular ?? false,
    updated_at: new Date().toISOString(),
  };

  if (instructions !== undefined) {
    const { data: currentGame } = await supabase
      .from("games")
      .select("instructions")
      .eq("id", id)
      .maybeSingle();

    const existingObj =
      currentGame?.instructions && typeof currentGame.instructions === "object"
        ? (currentGame.instructions as Record<string, unknown>)
        : {};

    const mappedInputFields = Array.isArray(instructions)
      ? (instructions as Record<string, unknown>[]).map((f) => ({
          name: (f.name as string) || (f.id as string) || "field",
          type: (f.type as string) || "text",
          label: (f.label as string) || (f.name as string) || "Field",
          placeholder: (f.placeholder as string) || "",
        }))
      : [];

    updatePayload.instructions = {
      ...existingObj,
      fields: instructions,
      input_fields: mappedInputFields,
      required_inputs: mappedInputFields.map((i) => i.name),
    } as Json;
  }

  const { error } = await supabase.from("games").update(updatePayload).eq("id", id);

  if (error) {
    logger.error("[updateGame] DB Error", { error });
    return { success: false, error: error.message || "Gagal mengupdate game." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/topup-products");
  return { success: true };
}

export async function toggleGameStatus(id: string, is_active: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("games")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logger.error("[toggleGameStatus] DB Error", { error });
    return { success: false, error: error.message || "Gagal mengubah status game." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/topup-products");
  return { success: true };
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

  if (currentUser.id === userId) {
    return { success: false, error: "Anda tidak dapat mengubah role akun Anda sendiri." };
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

  if (currentUser.id === userId) {
    return { success: false, error: "Anda tidak dapat mengubah status akun Anda sendiri." };
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
    generated_password?: string;
  }>("admin-create-user", {
    body: { email, password, full_name, role_id: role_id || null },
  });

  if (error) {
    let message = "Gagal membuat pengguna.";
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = (await ctx.json()) as any;
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
  return {
    success: true,
    data: { id: data.id },
    ...(data.generated_password ? { generatedPassword: data.generated_password } : {}),
  };
}

export async function updateRolePermissions(roleId: string, permissions: Record<string, boolean>) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: targetRole } = await supabase
    .from("roles")
    .select("name")
    .eq("id", roleId)
    .single();

  if (targetRole && ["OWNER", "MEMBER"].includes(targetRole.name.toUpperCase())) {
    return {
      success: false,
      error: `Hak akses untuk role sistem (${targetRole.name}) telah dikunci dan tidak dapat diubah.`,
    };
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
    return { success: false, error: error.message || "Gagal meng-update hak akses." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function createRole(name: string, description?: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  if (!name || !name.trim()) {
    return { success: false, error: "Nama role wajib diisi." };
  }

  const normalizedName = name.trim().toUpperCase();

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name: normalizedName,
      description: description?.trim() || null,
      permissions: {},
    })
    .select()
    .single();

  if (error) {
    logger.error("Error creating role", { error });
    return { success: false, error: error.message || "Gagal membuat role baru." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, data };
}

export async function deleteRole(roleId: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: targetRole } = await supabase
    .from("roles")
    .select("name")
    .eq("id", roleId)
    .single();

  if (targetRole && ["OWNER", "ADMIN", "MEMBER"].includes(targetRole.name.toUpperCase())) {
    return { success: false, error: "Role sistem (OWNER, ADMIN, MEMBER) tidak dapat dihapus." };
  }

  const { error } = await supabase.from("roles").delete().eq("id", roleId);

  if (error) {
    logger.error("Error deleting role", { error });
    return { success: false, error: error.message || "Gagal menghapus role." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Site Settings ───────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("key, value, description, updated_at")
    .order("key");

  if (error) {
    logger.error("Error fetching site settings", { error });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateSiteSetting(key: string, value: Json, description?: string) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase.from("settings").upsert(
    {
      key,
      value,
      ...(description !== undefined ? { description } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logger.error("Error updating site setting", { key, error });
    return { success: false, error: error.message || "Gagal menyimpan pengaturan." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
