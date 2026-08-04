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

export async function getTopupProducts(page?: number, limit?: number) {
  return runAction("getTopupProducts", async () => {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("products")
      .select("*", { count: "exact" })
      .order("game_slug", { ascending: true });

    if (page && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error("Error fetching topup products", { error });
      return { data: null, totalCount: 0, error: error.message };
    }

    return { data, totalCount: count || 0, error: null };
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
