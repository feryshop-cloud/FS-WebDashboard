"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import type { Database } from "@/types/database.types";

type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

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

export async function createPenjualan(formData: FormData) {
  return runAction("createPenjualan", async () => {
    const customer_name = formData.get("customer_name") as string;
    const customer_phone = (formData.get("customer_phone") as string) || "";
    const stock_id = formData.get("stock_id") as string;
    const price = parseFloat(formData.get("price") as string);
    const payment_amount = parseFloat(formData.get("payment_amount") as string) || 0;
    const account_id = formData.get("account_id") as string;

    if (!customer_name || !stock_id || !price) {
      throw new Error("Nama customer, stok, dan harga deal wajib diisi.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
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
        .insert({ name: customer_name, phone: customer_phone })
        .select()
        .single();
      if (customerErr) throw customerErr;
      customerId = newCustomer.id;
    }

    // 2. Insert Deal (exclude remaining_balance and payment_percentage)
    const dealNumber = `DEAL-${Date.now()}`;
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert({
        deal_number: dealNumber,
        customer_id: customerId,
        deal_type: "Penjualan",
        total_deal_price: price,
        total_paid: 0,
        status: "DRAFT",
        handled_by: user.id,
      })
      .select()
      .single();
    if (dealErr) throw dealErr;

    // 3. Insert Deal Item
    const { error: itemErr } = await supabase.from("deal_items").insert({
      deal_id: deal.id,
      stock_id: stock_id,
      price: price,
    });
    if (itemErr) throw itemErr;

    // 4. Process initial payment if any, otherwise set stock to BOOKED
    if (payment_amount > 0 && account_id) {
      const { error: paymentErr } = await supabase.rpc("process_payment", {
        p_deal_id: deal.id,
        p_account_id: account_id,
        p_amount: payment_amount,
        p_notes: "Pembayaran awal deal penjualan",
        p_admin_id: user.id,
      });
      if (paymentErr) throw paymentErr;
    } else {
      const { error: stockErr } = await supabase
        .from("stocks")
        .update({ status: "BOOKED" })
        .eq("id", stock_id);
      if (stockErr) throw stockErr;
    }

    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/ledger");
  });
}

export async function deleteDeal(id: string) {
  return runAction("deleteDeal", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // 1. Delete deal items first
    const { error: itemsErr } = await supabase.from("deal_items").delete().eq("deal_id", id);
    if (itemsErr) {
      logger.error("Error deleting deal items", { error: itemsErr });
    }

    // 2. Delete deal
    const { error } = await supabase.from("deals").delete().eq("id", id);
    if (error) {
      logger.error("Error deleting deal", { error });
      throw new Error("Gagal menghapus transaksi deal: " + error.message);
    }

    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/ledger");
  });
}

export async function updateDeal(id: string, data: DealUpdate) {
  return runAction("updateDeal", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    const { error } = await supabase.from("deals").update(data).eq("id", id);

    if (error) {
      logger.error("Error updating deal", { error });
      throw new Error("Gagal mengolah/mengubah data deal.");
    }

    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/ledger");
  });
}

