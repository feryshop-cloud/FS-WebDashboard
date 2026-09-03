"use server";

import { createClient } from "@/lib/supabase/server";
import type { DealStatus, StockStatus } from "@/types/database";
import { revalidatePath } from "next/cache";
import { purgeStorefront, STOREFRONT_TAGS } from "@/lib/store-revalidate";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

import { getErrorMessage } from "@/lib/error";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function toInventoryStatus(status: StockStatus): "AVAILABLE" | "SOLD" | "UNPOSTED" {
  if (status === "SOLD") return "SOLD";
  if (status === "AVAILABLE") return "AVAILABLE";
  return "UNPOSTED";
}

export async function getTradeInDeals() {
  return runAction("getTradeInDeals", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select(
        `
          *,
          customers (name, phone),
          deal_items (
            stock_id,
            stocks (id, name)
          ),
          trade_in_items (
            description,
            estimated_value
          )
        `,
      )
      .eq("deal_type", "Tukar Tambah")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching trade in deals", { error });
      throw new Error("Gagal memuat data transaksi Tukar Tambah.");
    }

    return data;
  });
}

export async function createTukarTambah(
  formData: FormData,
): Promise<ActionResult<{ dealId: string }>> {
  return runAction("createTukarTambah", async () => {
    try {
      const customer_name = (formData.get("customer_name") as string)?.trim();
      const customer_phone = ((formData.get("customer_phone") as string) || "").trim();
      const stock_out_id = formData.get("stock_out_id") as string;
      const price_out = parseFloat(formData.get("price_out") as string);

      const tt_desc = (formData.get("tt_desc") as string)?.trim();
      const tt_value = parseFloat(formData.get("tt_value") as string);

      const rawPayment = formData.get("payment_amount") as string;
      const payment_amount = rawPayment ? parseFloat(rawPayment) : 0;
      const payment_direction = formData.get("payment_direction") as string; // 'IN' or 'OUT'
      const account_id = formData.get("account_id") as string;

      if (
        !customer_name ||
        !stock_out_id ||
        isNaN(price_out) ||
        price_out <= 0 ||
        !tt_desc ||
        isNaN(tt_value) ||
        tt_value <= 0
      ) {
        return {
          success: false,
          error: "Data customer, stok keluar, dan aset tukar tambah wajib diisi lengkap.",
        };
      }

      if (payment_amount > 0 && !account_id) {
        return {
          success: false,
          error: "Rekening tujuan/sumber wajib dipilih untuk transaksi dengan uang tunai.",
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
          return { success: false, error: "Gagal membuat customer baru: " + customerErr.message };
        }
        customerId = newCustomer.id;
      }

      // 2. Insert Deal
      const dealNumber = `DEAL-${Date.now()}`;
      const initialPercentage = (tt_value / price_out) * 100;
      let initialDealStatus: DealStatus = "DRAFT";
      let initialStockStatus: StockStatus = "AVAILABLE";

      if (initialPercentage >= 100) {
        initialDealStatus = "PAID";
        initialStockStatus = "SOLD";
      } else if (initialPercentage >= 70) {
        initialDealStatus = "LIMITED_ACCESS";
        initialStockStatus = "LIMITED_ACCESS";
      } else if (initialPercentage >= 20) {
        initialDealStatus = "BOOKED";
        initialStockStatus = "BOOKED";
      }

      const { data: deal, error: dealErr } = await supabase
        .from("deals")
        .insert({
          deal_number: dealNumber,
          customer_id: customerId,
          customer_name: customer_name,
          customer_contact: customer_phone || null,
          stock_id: stock_out_id,
          deal_type: "Tukar Tambah",
          deal_price: price_out,
          total_deal_price: price_out,
          total_paid: tt_value,
          remaining_balance: Math.max(0, price_out - tt_value),
          payment_percentage: Math.min(100, initialPercentage),
          status: initialDealStatus,
          admin_id: user.id,
          handled_by: user.id,
        })
        .select()
        .single();
      if (dealErr || !deal) {
        logger.error("Error creating deal", { error: dealErr });
        return {
          success: false,
          error: "Gagal membuat transaksi deal: " + (dealErr?.message || "Unknown"),
        };
      }

      // 3. Insert Deal Item
      const { error: itemErr } = await supabase.from("deal_items").insert({
        deal_id: deal.id,
        stock_id: stock_out_id,
        price: price_out,
      });
      if (itemErr) {
        logger.error("Error creating deal item", { error: itemErr });
        return {
          success: false,
          error: "Gagal menghubungkan stok ke transaksi: " + itemErr.message,
        };
      }

      // 4. Insert Trade-in Item
      const { error: ttErr } = await supabase.from("trade_in_items").insert({
        deal_id: deal.id,
        description: tt_desc,
        estimated_value: tt_value,
      });
      if (ttErr) {
        logger.error("Error creating trade-in item", { error: ttErr });
        return { success: false, error: "Gagal mencatat aset barter TT: " + ttErr.message };
      }

      // 5. Update outgoing stock & inventory status initially
      const nowIso = new Date().toISOString();
      await supabase
        .from("stocks")
        .update({
          status: initialStockStatus,
          sold_date: initialStockStatus === "SOLD" ? nowIso : null,
          booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
            initialStockStatus,
          )
            ? nowIso
            : null,
          updated_at: nowIso,
        })
        .eq("id", stock_out_id);

      await supabase
        .from("inventory")
        .update({
          status: toInventoryStatus(initialStockStatus),
          updated_at: nowIso,
        })
        .eq("id", stock_out_id);

      // 6. Handle cash payment if any
      if (payment_amount > 0 && account_id) {
        if (payment_direction === "IN") {
          // Customer pays shop cash: standard process_payment RPC
          const { error: paymentErr } = await supabase.rpc("process_payment", {
            p_deal_id: deal.id,
            p_account_id: account_id,
            p_amount: payment_amount,
            p_notes: `Tukar Tambah - Pembayaran Awal (${tt_desc})`,
            p_admin_id: user.id,
          });
          if (paymentErr) {
            logger.error("Error in process_payment", { error: paymentErr });
            return {
              success: false,
              error: "Gagal memproses pembayaran tunai customer: " + paymentErr.message,
            };
          }
        } else {
          // Shop pays customer cash (OUT)
          const { error: payErr } = await supabase.from("payments").insert({
            deal_id: deal.id,
            account_id: account_id,
            amount: payment_amount,
            payment_type: "OUT",
            status: "COMPLETED",
            notes: `Tukar Tambah - Kembalian Tunai (${tt_desc})`,
            handled_by: user.id,
          });
          if (payErr) {
            logger.error("Error inserting payment OUT", { error: payErr });
            return {
              success: false,
              error: "Gagal mencatat pembayaran tunai keluar: " + payErr.message,
            };
          }

          // Insert Finance Ledger
          const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
            account_id: account_id,
            transaction_type: "PAYMENT_OUT",
            amount: -payment_amount,
            notes: `Tukar Tambah - Kembalian Tunai (${tt_desc})`,
            ref_id: deal.id,
            created_by: user.id,
          });
          if (ledgerErr) {
            logger.error("Error inserting ledger OUT", { error: ledgerErr });
          }

          // Deduct Account Balance
          const { data: account, error: _accFetchErr } = await supabase
            .from("accounts")
            .select("balance")
            .eq("id", account_id)
            .single();
          if (account) {
            await supabase
              .from("accounts")
              .update({ balance: Number(account.balance) - payment_amount })
              .eq("id", account_id);
          }

          // Re-calculate deal status with net payment
          const netPaid = tt_value - payment_amount;
          const netPercentage = (netPaid / price_out) * 100;
          let finalDealStatus: DealStatus = "DRAFT";
          let finalStockStatus: StockStatus = "AVAILABLE";

          if (netPercentage >= 100) {
            finalDealStatus = "PAID";
            finalStockStatus = "SOLD";
          } else if (netPercentage >= 70) {
            finalDealStatus = "LIMITED_ACCESS";
            finalStockStatus = "LIMITED_ACCESS";
          } else if (netPercentage >= 20) {
            finalDealStatus = "BOOKED";
            finalStockStatus = "BOOKED";
          }

          await supabase
            .from("deals")
            .update({
              total_paid: netPaid,
              status: finalDealStatus,
            })
            .eq("id", deal.id);

          await supabase
            .from("stocks")
            .update({
              status: finalStockStatus,
              sold_date: finalStockStatus === "SOLD" ? nowIso : null,
              booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
                finalStockStatus,
              )
                ? nowIso
                : null,
              updated_at: nowIso,
            })
            .eq("id", stock_out_id);

          await supabase
            .from("inventory")
            .update({
              status: toInventoryStatus(finalStockStatus),
              updated_at: nowIso,
            })
            .eq("id", stock_out_id);
        }
      }

      revalidatePath("/dashboard/trade-in");
      revalidatePath("/dashboard/deals");
      revalidatePath(`/dashboard/deals/${deal.id}`);
      revalidatePath("/dashboard/inventory");
      revalidatePath("/dashboard/stock");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard/ledger");
      purgeStorefront(STOREFRONT_TAGS.marketplace);

      return { success: true, data: { dealId: deal.id } };
    } catch (err: unknown) {
      logger.error("createTukarTambah exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Terjadi kesalahan sistem saat membuat tukar tambah."),
      };
    }
  });
}

export async function updateTukarTambah(id: string, formData: FormData): Promise<ActionResult> {
  return runAction("updateTukarTambah", async () => {
    try {
      const customer_name = (formData.get("customer_name") as string)?.trim();
      const customer_phone = ((formData.get("customer_phone") as string) || "").trim();
      const stock_out_id = formData.get("stock_out_id") as string;
      const price_out = parseFloat(formData.get("price_out") as string);

      const tt_desc = (formData.get("tt_desc") as string)?.trim();
      const tt_value = parseFloat(formData.get("tt_value") as string);

      const rawPayment = formData.get("payment_amount") as string;
      const payment_amount = rawPayment ? parseFloat(rawPayment) : 0;
      const _payment_direction = formData.get("payment_direction") as string;
      const account_id = formData.get("account_id") as string;

      if (
        !customer_name ||
        !stock_out_id ||
        isNaN(price_out) ||
        price_out <= 0 ||
        !tt_desc ||
        isNaN(tt_value) ||
        tt_value <= 0
      ) {
        return {
          success: false,
          error: "Data customer, stok keluar, dan aset tukar tambah wajib diisi lengkap.",
        };
      }

      if (payment_amount > 0 && !account_id) {
        return {
          success: false,
          error: "Rekening tujuan/sumber wajib dipilih untuk transaksi dengan uang tunai.",
        };
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      const { data: existingDeal, error: dealFetchErr } = await supabase
        .from("deals")
        .select(
          `
          *,
          deal_items (stock_id),
          trade_in_items (id),
          payments (id)
        `,
        )
        .eq("id", id)
        .single();

      if (dealFetchErr || !existingDeal) {
        return { success: false, error: "Transaksi Tukar Tambah tidak ditemukan." };
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
          return { success: false, error: "Gagal membuat customer: " + customerErr.message };
        }
        customerId = newCustomer.id;
      }

      // Calculate new status
      const initialPercentage = (tt_value / price_out) * 100;
      let initialDealStatus: DealStatus = "DRAFT";
      let initialStockStatus: StockStatus = "AVAILABLE";

      if (initialPercentage >= 100) {
        initialDealStatus = "PAID";
        initialStockStatus = "SOLD";
      } else if (initialPercentage >= 70) {
        initialDealStatus = "LIMITED_ACCESS";
        initialStockStatus = "LIMITED_ACCESS";
      } else if (initialPercentage >= 20) {
        initialDealStatus = "BOOKED";
        initialStockStatus = "BOOKED";
      }

      const nowIso = new Date().toISOString();

      // 2. Update Deal
      await supabase
        .from("deals")
        .update({
          customer_id: customerId,
          customer_name: customer_name,
          customer_contact: customer_phone || null,
          stock_id: stock_out_id,
          total_deal_price: price_out,
          deal_price: price_out,
          total_paid: tt_value,
          status: initialDealStatus,
          updated_at: nowIso,
        })
        .eq("id", id);

      // 3. Update Deal Item
      const oldStockId = existingDeal.deal_items?.[0]?.stock_id;
      await supabase
        .from("deal_items")
        .update({
          stock_id: stock_out_id,
          price: price_out,
        })
        .eq("deal_id", id);

      // Restore old stock & inventory if changed
      if (oldStockId && oldStockId !== stock_out_id) {
        await supabase
          .from("stocks")
          .update({ status: "AVAILABLE", sold_date: null, booking_date: null, updated_at: nowIso })
          .eq("id", oldStockId);

        await supabase
          .from("inventory")
          .update({ status: "AVAILABLE", updated_at: nowIso })
          .eq("id", oldStockId);
      }

      // Update new stock & inventory status
      await supabase
        .from("stocks")
        .update({
          status: initialStockStatus,
          sold_date: initialStockStatus === "SOLD" ? nowIso : null,
          booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
            initialStockStatus,
          )
            ? nowIso
            : null,
          updated_at: nowIso,
        })
        .eq("id", stock_out_id);

      await supabase
        .from("inventory")
        .update({
          status: toInventoryStatus(initialStockStatus),
          updated_at: nowIso,
        })
        .eq("id", stock_out_id);

      // 4. Update Trade-in Items
      await supabase
        .from("trade_in_items")
        .update({
          description: tt_desc,
          estimated_value: tt_value,
        })
        .eq("deal_id", id);

      revalidatePath("/dashboard/trade-in");
      revalidatePath("/dashboard/deals");
      revalidatePath(`/dashboard/deals/${id}`);
      revalidatePath("/dashboard/inventory");
      revalidatePath("/dashboard/stock");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard/ledger");
      purgeStorefront(STOREFRONT_TAGS.marketplace);

      return { success: true };
    } catch (err: unknown) {
      logger.error("updateTukarTambah exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal mengubah transaksi Tukar Tambah."),
      };
    }
  });
}
