"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export type TopupOrdersFilters = {
  search?: string;
  paymentStatus?: string;
  buyStatus?: string;
  page?: number;
  pageSize?: number;
};

export type TopupOrdersResult = {
  data: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getTopupOrders(filters: TopupOrdersFilters = {}): Promise<TopupOrdersResult> {
  return runAction("getTopupOrders", async () => {
    const { search = "", paymentStatus = "", buyStatus = "", page = 1, pageSize = 20 } = filters;

    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("orders").select("*", { count: "exact" });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`order_id.ilike.${term},nickname.ilike.${term},id_games.ilike.${term}`);
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }

    if (buyStatus) {
      query = query.eq("buy_status", buyStatus);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error("Error fetching topup orders", { error });
      throw new Error("Gagal memuat data pesanan top-up.");
    }

    return {
      data: (data as OrderRow[]) || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  });
}

export async function updateTopupOrder(
  orderId: string,
  payload: { buy_status?: string; serial_number?: string },
): Promise<{ success: boolean; error: string | null }> {
  return runAction("updateTopupOrder", async () => {
    try {
      if (!orderId) {
        return { success: false, error: "ID pesanan tidak valid." };
      }

      const supabase = await createClient();

      const { data: existing, error: fetchError } = await supabase
        .from("orders")
        .select("buy_status")
        .eq("id", orderId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: "Pesanan tidak ditemukan." };
      }

      if (existing.buy_status === "success" || existing.buy_status === "failed") {
        return {
          success: false,
          error: `Pesanan dengan status "${existing.buy_status === "success" ? "Sukses" : "Gagal"}" tidak dapat diubah.`,
        };
      }

      const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
        updated_at: new Date().toISOString(),
      };

      if (payload.buy_status !== undefined) {
        updatePayload.buy_status = payload.buy_status;
      }
      if (payload.serial_number !== undefined) {
        updatePayload.serial_number = payload.serial_number;
      }

      const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId);

      if (error) throw error;

      revalidatePath("/dashboard/topup-orders");
      return { success: true, error: null };
    } catch (error: unknown) {
      logger.error("Error updating topup order", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memperbarui pesanan.",
      };
    }
  });
}
