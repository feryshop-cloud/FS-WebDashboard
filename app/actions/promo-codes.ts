"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { purgeStorefront, STOREFRONT_TAGS } from "@/lib/store-revalidate";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export interface PromoCodeRow {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number | string;
  min_order: number | string | null;
  max_discount: number | string | null;
  quota: number | null;
  used_count: number | null;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export async function getPromoCodes() {
  return runAction("getPromoCodes", async () => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching promo codes", { error });
      return [] as PromoCodeRow[];
    }

    return (data || []) as PromoCodeRow[];
  });
}

export async function createPromoCode(formData: FormData) {
  return runAction("createPromoCode", async () => {
    const code = String(formData.get("code") || "")
      .trim()
      .toUpperCase();
    const discountType = String(formData.get("discount_type") || "percent");
    const discountValue = Number(formData.get("discount_value") || 0);
    const minOrder = Number(formData.get("min_order") || 0);
    const maxDiscount = Number(formData.get("max_discount") || 0);
    const quota = Number(formData.get("quota") || 100);
    const isActive = formData.get("is_active") === "on";
    const startDate = formData.get("start_date") as string | null;
    const endDate = formData.get("end_date") as string | null;

    if (!code || !discountValue) {
      throw new Error("Kode dan nilai diskon wajib diisi.");
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("promo_codes").insert({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_order: minOrder || 0,
      max_discount: maxDiscount || 0,
      quota: quota || 100,
      used_count: 0,
      is_active: isActive,
      start_date: startDate || null,
      end_date: endDate || null,
    });

    if (error) {
      logger.error("Error creating promo code", { error });
      throw new Error(
        error.message.includes("duplicate") ? "Kode promo sudah ada." : "Gagal membuat kode promo.",
      );
    }

    revalidatePath("/dashboard/promo-codes");
    purgeStorefront(STOREFRONT_TAGS.products);
  });
}

export async function updatePromoCode(id: number, formData: FormData) {
  return runAction("updatePromoCode", async () => {
    const code = String(formData.get("code") || "")
      .trim()
      .toUpperCase();
    const discountType = String(formData.get("discount_type") || "percent");
    const discountValue = Number(formData.get("discount_value") || 0);
    const minOrder = Number(formData.get("min_order") || 0);
    const maxDiscount = Number(formData.get("max_discount") || 0);
    const quota = Number(formData.get("quota") || 100);
    const isActive = formData.get("is_active") === "on";
    const startDate = formData.get("start_date") as string | null;
    const endDate = formData.get("end_date") as string | null;

    if (!id || !code || !discountValue) {
      throw new Error("ID, kode, dan nilai diskon wajib diisi.");
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)("promo_codes")
      .update({
        code,
        discount_type: discountType,
        discount_value: discountValue,
        min_order: minOrder || 0,
        max_discount: maxDiscount || 0,
        quota: quota || 100,
        is_active: isActive,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .eq("id", id)
      .select("id");

    if (error) {
      logger.error("Error updating promo code", { error });
      throw new Error(
        error.message.includes("duplicate")
          ? "Kode promo sudah ada."
          : `Gagal memperbarui kode promo (${error.code ?? error.message}).`,
      );
    }

    if (!data || data.length === 0) {
      logger.error("Promo code update matched 0 rows", { id });
      throw new Error("Kode promo tidak ditemukan atau tidak dapat diubah.");
    }

    revalidatePath("/dashboard/promo-codes");
    purgeStorefront(STOREFRONT_TAGS.products);
  });
}

export async function deletePromoCode(id: number) {
  return runAction("deletePromoCode", async () => {
    if (!id) throw new Error("ID promo wajib diisi.");

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("promo_codes").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting promo code", { error });
      throw new Error("Gagal menghapus kode promo.");
    }

    revalidatePath("/dashboard/promo-codes");
    purgeStorefront(STOREFRONT_TAGS.products);
  });
}
