"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { purgeStorefront, STOREFRONT_TAGS } from "@/lib/store-revalidate";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import type { Database } from "@/types/database.types";

import { getErrorMessage } from "@/lib/error";

type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getDeals() {
  return runAction("getDeals", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select(
        `
          *,
          customers (name),
          deal_items (
            stocks (name)
          )
        `,
      )
      .eq("deal_type", "Penjualan")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching deals", { error });
      throw new Error("Gagal memuat data transaksi.");
    }

    return data;
  });
}

export async function createPenjualan(
  formData: FormData,
): Promise<ActionResult<{ dealId: string }>> {
  return runAction("createPenjualan", async () => {
    try {
      const customer_name = (formData.get("customer_name") as string)?.trim();
      const customer_phone = ((formData.get("customer_phone") as string) || "").trim();
      const stock_id = formData.get("stock_id") as string;
      const rawPrice = formData.get("price") as string;
      const price = parseFloat(rawPrice);
      const rawPayment = formData.get("payment_amount") as string;
      const payment_amount = rawPayment ? parseFloat(rawPayment) : 0;
      const account_id = formData.get("account_id") as string;

      if (!customer_name) {
        return { success: false, error: "Nama customer wajib diisi." };
      }
      if (!stock_id) {
        return { success: false, error: "Pilih stok yang akan dijual." };
      }
      if (isNaN(price) || price <= 0) {
        return { success: false, error: "Harga deal harus berupa angka lebih besar dari 0." };
      }
      if (payment_amount > 0 && !account_id) {
        return {
          success: false,
          error: "Pilih rekening tujuan untuk nominal pembayaran yang diisi.",
        };
      }
      if (payment_amount > price) {
        return {
          success: false,
          error: "Nominal pembayaran awal tidak boleh melebihi harga deal.",
        };
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      // 1. Find or create customer
      let customerId: string;
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("name", customer_name)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerErr } = await supabase
          .from("customers")
          .insert({ name: customer_name, phone: customer_phone || null })
          .select()
          .single();
        if (customerErr) {
          logger.error("Error creating customer", { error: customerErr });
          return {
            success: false,
            error: "Gagal membuat data customer baru: " + customerErr.message,
          };
        }
        customerId = newCustomer.id;
      }

      // 2. Insert Deal with all denormalized fields populated
      const dealNumber = `DEAL-${Date.now()}`;
      const { data: deal, error: dealErr } = await supabase
        .from("deals")
        .insert({
          deal_number: dealNumber,
          customer_id: customerId,
          customer_name: customer_name,
          customer_contact: customer_phone || null,
          stock_id: stock_id,
          deal_type: "Penjualan",
          deal_price: price,
          total_deal_price: price,
          total_paid: 0,
          remaining_balance: price,
          payment_percentage: 0,
          status: "DRAFT",
          admin_id: user.id,
          handled_by: user.id,
        })
        .select()
        .single();
      if (dealErr || !deal) {
        logger.error("Error inserting deal", { error: dealErr });
        return { success: false, error: "Gagal membuat deal: " + (dealErr?.message || "Unknown") };
      }

      // 3. Insert Deal Item
      const { error: itemErr } = await supabase.from("deal_items").insert({
        deal_id: deal.id,
        stock_id: stock_id,
        price: price,
      });
      if (itemErr) {
        logger.error("Error inserting deal item", { error: itemErr });
        return { success: false, error: "Gagal menghubungkan stok ke deal: " + itemErr.message };
      }

      // 4. Process initial payment if any, otherwise set stock to BOOKED
      const nowIso = new Date().toISOString();
      if (payment_amount > 0 && account_id) {
        const { error: paymentErr } = await supabase.rpc("process_payment", {
          p_deal_id: deal.id,
          p_account_id: account_id,
          p_amount: payment_amount,
          p_notes: "Pembayaran awal deal penjualan",
          p_admin_id: user.id,
        });
        if (paymentErr) {
          logger.error("Error processing initial payment", { error: paymentErr });
          return {
            success: false,
            error: "Gagal memproses pembayaran awal: " + paymentErr.message,
          };
        }

        // Determine target stock status based on payment percentage
        const pct = (payment_amount / price) * 100;
        const newStatus =
          pct >= 100 ? "SOLD" : pct >= 70 ? "LIMITED_ACCESS" : pct >= 20 ? "BOOKED" : "AVAILABLE";

        // Dual update stocks & inventory to stay completely in sync
        await supabase
          .from("stocks")
          .update({
            status: newStatus,
            sold_date: newStatus === "SOLD" ? nowIso : null,
            booking_date: ["BOOKED", "LIMITED_ACCESS", "SOLD"].includes(newStatus) ? nowIso : null,
            updated_at: nowIso,
          })
          .eq("id", stock_id);

        const invStatus =
          newStatus === "SOLD" ? "SOLD" : newStatus === "AVAILABLE" ? "AVAILABLE" : "UNPOSTED";

        await supabase
          .from("inventory")
          .update({
            status: invStatus,
            updated_at: nowIso,
          })
          .eq("id", stock_id);
      } else {
        // Set stock to BOOKED & inventory to UNPOSTED (hidden from storefront)
        await supabase
          .from("stocks")
          .update({
            status: "BOOKED",
            booking_date: nowIso,
            updated_at: nowIso,
          })
          .eq("id", stock_id);

        await supabase
          .from("inventory")
          .update({
            status: "UNPOSTED",
            updated_at: nowIso,
          })
          .eq("id", stock_id);
      }

      revalidatePath("/dashboard/deals");
      revalidatePath(`/dashboard/deals/${deal.id}`);
      revalidatePath("/dashboard/inventory");
      revalidatePath("/dashboard/stock");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard/ledger");
      purgeStorefront(STOREFRONT_TAGS.marketplace);

      return { success: true, data: { dealId: deal.id } };
    } catch (err: unknown) {
      logger.error("createPenjualan exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Terjadi kesalahan internal saat memproses transaksi."),
      };
    }
  });
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  return runAction("deleteDeal", async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      // Fetch linked stocks to restore them to AVAILABLE if appropriate
      const { data: items } = await supabase
        .from("deal_items")
        .select("stock_id")
        .eq("deal_id", id);

      const nowIso = new Date().toISOString();
      for (const item of items || []) {
        if (item.stock_id) {
          await supabase
            .from("stocks")
            .update({
              status: "AVAILABLE",
              booking_date: null,
              sold_date: null,
              updated_at: nowIso,
            })
            .eq("id", item.stock_id);

          await supabase
            .from("inventory")
            .update({ status: "AVAILABLE", updated_at: nowIso })
            .eq("id", item.stock_id);
        }
      }

      // 1. Delete trade-in items if any
      const { error: tradeInErr } = await supabase
        .from("trade_in_items")
        .delete()
        .eq("deal_id", id);
      if (tradeInErr) {
        logger.error("Error deleting trade in items", { error: tradeInErr });
      }

      // 2. Delete deal items first
      const { error: itemsErr } = await supabase.from("deal_items").delete().eq("deal_id", id);
      if (itemsErr) {
        logger.error("Error deleting deal items", { error: itemsErr });
      }

      // 3. Delete deal
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) {
        logger.error("Error deleting deal", { error });
        return { success: false, error: "Gagal menghapus transaksi deal: " + error.message };
      }

      revalidatePath("/dashboard/deals");
      revalidatePath("/dashboard/inventory");
      revalidatePath("/dashboard/stock");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard/ledger");
      revalidatePath("/dashboard/trade-in");
      purgeStorefront(STOREFRONT_TAGS.marketplace);

      return { success: true };
    } catch (err: unknown) {
      logger.error("deleteDeal exception", { err });
      return { success: false, error: getErrorMessage(err, "Gagal menghapus transaksi.") };
    }
  });
}

export async function updateDeal(id: string, data: DealUpdate): Promise<ActionResult> {
  return runAction("updateDeal", async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      const { error } = await supabase.from("deals").update(data).eq("id", id);

      if (error) {
        logger.error("Error updating deal", { error });
        return { success: false, error: "Gagal mengolah/mengubah data deal: " + error.message };
      }

      revalidatePath("/dashboard/deals");
      revalidatePath(`/dashboard/deals/${id}`);
      revalidatePath("/dashboard/inventory");
      revalidatePath("/dashboard/stock");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard/ledger");
      purgeStorefront(STOREFRONT_TAGS.marketplace);

      return { success: true };
    } catch (err: unknown) {
      logger.error("updateDeal exception", { err });
      return { success: false, error: getErrorMessage(err, "Gagal mengubah transaksi.") };
    }
  });
}
