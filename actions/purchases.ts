"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/error";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { Game, PurchasePaymentStatus, PurchaseWithRelations } from "@/types/database";

export async function purchaseStock(data: {
  category: string;
  name: string;
  account_details: string;
  username?: string;
  password?: string;
  capital_price: number;
  post_price: number;
  current_price: number;
  seller_info?: string;
  internal_notes?: string;
  purchase_payment_status: PurchasePaymentStatus;
  payment_account_id?: string | null;
}): Promise<{ success: boolean; stockId?: string; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    if (data.purchase_payment_status === "LUNAS" && !data.payment_account_id) {
      return { success: false, error: "Target Account must be selected for LUNAS payments" };
    }

    const { data: stockId, error } = await supabase.rpc("process_stock_purchase", {
      p_category: data.category,
      p_name: data.name,
      p_account_details: (data.account_details || null) as string,
      p_username: (data.username || null) as string,
      p_password: (data.password || null) as string,
      p_capital_price: data.capital_price,
      p_post_price: data.post_price,
      p_current_price: data.current_price,
      p_seller_info: (data.seller_info || null) as string,
      p_internal_notes: (data.internal_notes || null) as string,
      p_purchase_payment_status: data.purchase_payment_status,
      p_payment_account_id: (data.payment_account_id || null) as string,
      p_admin_id: adminId,
    });

    if (error) throw error;

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/purchases");

    return { success: true, stockId: stockId as string, error: null };
  } catch (error: unknown) {
    logger.error("Error purchasing stock", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getPurchases(): Promise<{
  data: PurchaseWithRelations[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stocks")
      .select(
        `
        *,
        accounts (name)
      `,
      )
      .order("purchase_date", { ascending: false });

    if (error) throw error;

    return { data: (data || []) as PurchaseWithRelations[], error: null };
  } catch (error: unknown) {
    logger.error("Error fetching purchases", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}

export async function getGames(): Promise<{
  data: Game[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("games").select("id, name").order("name");

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error: unknown) {
    logger.error("Error fetching games", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}
