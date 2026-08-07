"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export type TopupProductInput = {
  game_slug: string;
  title: string;
  selling_price: number;
  cost_price: number;
  sku?: string | null;
  is_active?: boolean;
  is_gangguan?: boolean;
};

export type TopupProductsFilters = {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: string;
  isGangguan?: string;
  page?: number;
  limit?: number;
};

export async function getTopupProducts(filters: TopupProductsFilters = {}) {
  return runAction("getTopupProducts", async () => {
    const {
      search = "",
      sortBy = "game_slug",
      sortOrder = "asc",
      isActive = "",
      isGangguan = "",
      page = 1,
      limit = 10,
    } = filters;

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from("products").select("*", { count: "exact" });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},game_slug.ilike.${term},sku.ilike.${term}`);
    }

    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    if (isGangguan === "true") {
      query = query.eq("is_gangguan", true);
    } else if (isGangguan === "false") {
      query = query.eq("is_gangguan", false);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (error) {
      logger.error("Error fetching topup products", { error });
      return { data: null, totalCount: 0, error: error.message };
    }

    const {
      data: games,
      error: gamesError,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = await (supabase as any).from("games").select("slug, name");
    if (gamesError) {
      logger.error("Error fetching games for topup products", { error: gamesError });
    }
    const gameNames = new Map<string, string>();
    for (const g of games ?? []) gameNames.set(g.slug, g.name);

    const rows = (data ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      game_name: gameNames.get(p.game_slug as string) ?? (p.game_slug as string),
    }));

    return { data: rows, totalCount: count || 0, error: null };
  });
}

export async function addTopupProduct(input: TopupProductInput) {
  return runAction("addTopupProduct", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("products").insert({
      game_slug: input.game_slug,
      title: input.title,
      selling_price: input.selling_price,
      cost_price: input.cost_price || 0,
      sku: input.sku || null,
      is_active: input.is_active ?? true,
      is_gangguan: input.is_gangguan ?? false,
    });

    if (error) {
      logger.error("Database Error creating topup product", { error });
      return { success: false, error: error.message || "Gagal menambahkan produk." };
    }

    revalidatePath("/dashboard/topup-products");
    return { success: true };
  });
}

export async function updateTopupProduct(id: string, input: TopupProductInput) {
  return runAction("updateTopupProduct", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("products")
      .update({
        game_slug: input.game_slug,
        title: input.title,
        selling_price: input.selling_price,
        cost_price: input.cost_price || 0,
        sku: input.sku || null,
        is_active: input.is_active ?? true,
        is_gangguan: input.is_gangguan ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Database Error updating topup product", { error });
      return { success: false, error: error.message || "Gagal meng-update produk." };
    }

    revalidatePath("/dashboard/topup-products");
    return { success: true };
  });
}

export async function deleteTopupProduct(id: string) {
  return runAction("deleteTopupProduct", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("products").delete().eq("id", id);

    if (error) {
      logger.error("Database Error deleting topup product", { error });
      return { success: false, error: error.message || "Gagal menghapus produk." };
    }

    revalidatePath("/dashboard/topup-products");
    return { success: true };
  });
}
