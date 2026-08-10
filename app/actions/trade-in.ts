"use server";

import { createClient } from "@/lib/supabase/server";
import type { DealStatus, StockStatus } from "@/types/database";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

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

export async function createTukarTambah(formData: FormData) {
  return runAction("createTukarTambah", async () => {
    const customer_name = formData.get("customer_name") as string;
    const customer_phone = (formData.get("customer_phone") as string) || "";
    const stock_out_id = formData.get("stock_out_id") as string;
    const price_out = parseFloat(formData.get("price_out") as string);

    const tt_desc = formData.get("tt_desc") as string;
    const tt_value = parseFloat(formData.get("tt_value") as string);

    const payment_amount = parseFloat(formData.get("payment_amount") as string) || 0;
    const payment_direction = formData.get("payment_direction") as string; // 'IN' or 'OUT'
    const account_id = formData.get("account_id") as string;

    if (!customer_name || !stock_out_id || !price_out || !tt_desc || !tt_value) {
      throw new Error("Data customer, stok keluar, dan aset tukar tambah wajib diisi lengkap.");
    }

    if (payment_amount > 0 && !account_id) {
      throw new Error("Rekening tujuan/sumber wajib dipilih untuk transaksi dengan uang tunai.");
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
        deal_type: "Tukar Tambah",
        total_deal_price: price_out,
        total_paid: tt_value,
        status: initialDealStatus,
        handled_by: user.id,
      })
      .select()
      .single();
    if (dealErr) throw dealErr;

    // 3. Insert Deal Item
    const { error: itemErr } = await supabase.from("deal_items").insert({
      deal_id: deal.id,
      stock_id: stock_out_id,
      price: price_out,
    });
    if (itemErr) throw itemErr;

    // 4. Insert Trade-in Item
    const { error: ttErr } = await supabase.from("trade_in_items").insert({
      deal_id: deal.id,
      description: tt_desc,
      estimated_value: tt_value,
    });
    if (ttErr) throw ttErr;

    // 5. Update outgoing stock status initially
    const { error: initialStockErr } = await supabase
      .from("stocks")
      .update({
        status: initialStockStatus,
        sold_date: initialStockStatus === "SOLD" ? new Date().toISOString() : null,
        booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
          initialStockStatus,
        )
          ? new Date().toISOString()
          : null,
      })
      .eq("id", stock_out_id);
    if (initialStockErr) throw initialStockErr;

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
        if (paymentErr) throw paymentErr;
      } else {
        // Shop pays customer cash (OUT)
        // Insert Payment
        const { error: payErr } = await supabase
          .from("payments")
          .insert({
            deal_id: deal.id,
            account_id: account_id,
            amount: payment_amount,
            payment_type: "OUT",
            status: "COMPLETED",
            notes: `Tukar Tambah - Kembalian Tunai (${tt_desc})`,
            handled_by: user.id,
          })
          .select()
          .single();
        if (payErr) throw payErr;

        // Insert Finance Ledger
        const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
          account_id: account_id,
          transaction_type: "PAYMENT_OUT",
          amount: -payment_amount,
          notes: `Tukar Tambah - Kembalian Tunai (${tt_desc})`,
          ref_id: deal.id,
          created_by: user.id,
        });
        if (ledgerErr) throw ledgerErr;

        // Deduct Account Balance
        const { data: account, error: accFetchErr } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", account_id)
          .single();
        if (accFetchErr) throw accFetchErr;

        const { error: accUpdateErr } = await supabase
          .from("accounts")
          .update({ balance: Number(account.balance) - payment_amount })
          .eq("id", account_id);
        if (accUpdateErr) throw accUpdateErr;

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

        // Update Deal (exclude remaining_balance and payment_percentage)
        const { error: dealUpdateErr } = await supabase
          .from("deals")
          .update({
            total_paid: netPaid,
            status: finalDealStatus,
          })
          .eq("id", deal.id);
        if (dealUpdateErr) throw dealUpdateErr;

        // Update Stock
        const { error: stockUpdateErr } = await supabase
          .from("stocks")
          .update({
            status: finalStockStatus,
            sold_date: finalStockStatus === "SOLD" ? new Date().toISOString() : null,
            booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
              finalStockStatus,
            )
              ? new Date().toISOString()
              : null,
          })
          .eq("id", stock_out_id);
        if (stockUpdateErr) throw stockUpdateErr;
      }
    } else {
      // If no payment, remaining_balance = price_out - tt_value
      const netPaid = tt_value;
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

      // Update Deal (exclude remaining_balance and payment_percentage)
      const { error: dealUpdateErr } = await supabase
        .from("deals")
        .update({
          total_paid: netPaid,
          status: finalDealStatus,
        })
        .eq("id", deal.id);
      if (dealUpdateErr) throw dealUpdateErr;

      // Update Stock
      const { error: stockUpdateErr } = await supabase
        .from("stocks")
        .update({
          status: finalStockStatus,
          sold_date: finalStockStatus === "SOLD" ? new Date().toISOString() : null,
          booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(
            finalStockStatus,
          )
            ? new Date().toISOString()
            : null,
        })
        .eq("id", stock_out_id);
      if (stockUpdateErr) throw stockUpdateErr;
    }

    revalidatePath("/dashboard/trade-in");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/ledger");
  });
}

export async function updateTukarTambah(id: string, formData: FormData) {
  return runAction("updateTukarTambah", async () => {
    const customer_name = formData.get("customer_name") as string;
    const customer_phone = (formData.get("customer_phone") as string) || "";
    const stock_out_id = formData.get("stock_out_id") as string;
    const price_out = parseFloat(formData.get("price_out") as string);

    const tt_desc = formData.get("tt_desc") as string;
    const tt_value = parseFloat(formData.get("tt_value") as string);

    const payment_amount = parseFloat(formData.get("payment_amount") as string) || 0;
    const payment_direction = formData.get("payment_direction") as string; // 'IN' or 'OUT'
    const account_id = formData.get("account_id") as string;

    if (!customer_name || !stock_out_id || !price_out || !tt_desc || !tt_value) {
      throw new Error("Data customer, stok keluar, dan aset tukar tambah wajib diisi lengkap.");
    }

    if (payment_amount > 0 && !account_id) {
      throw new Error("Rekening tujuan/sumber wajib dipilih untuk transaksi dengan uang tunai.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // Fetch existing deal data to check for differences
    const { data: existingDeal, error: dealFetchErr } = await supabase
      .from("deals")
      .select(`
        *,
        deal_items (stock_id),
        trade_in_items (id),
        payments (id)
      `)
      .eq("id", id)
      .single();

    if (dealFetchErr || !existingDeal) {
      throw new Error("Transaksi Tukar Tambah tidak ditemukan.");
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

    // 2. Update Deal
    const { error: dealUpdateErr } = await supabase
      .from("deals")
      .update({
        customer_id: customerId,
        total_deal_price: price_out,
        total_paid: tt_value,
        status: initialDealStatus,
      })
      .eq("id", id);
    if (dealUpdateErr) throw dealUpdateErr;

    // 3. Update or Insert Deal Item
    const oldStockId = existingDeal.deal_items?.[0]?.stock_id;
    const { error: itemUpdateErr } = await supabase
      .from("deal_items")
      .update({
        stock_id: stock_out_id,
        price: price_out,
      })
      .eq("deal_id", id);
    if (itemUpdateErr) throw itemUpdateErr;

    // Restore old stock status if it changed
    if (oldStockId && oldStockId !== stock_out_id) {
      await supabase.from("stocks").update({ status: "AVAILABLE", sold_date: null, booking_date: null }).eq("id", oldStockId);
    }

    // Update new stock status
    await supabase.from("stocks").update({
      status: initialStockStatus,
      sold_date: initialStockStatus === "SOLD" ? new Date().toISOString() : null,
      booking_date: (["BOOKED", "LIMITED_ACCESS", "SOLD"] as StockStatus[]).includes(initialStockStatus)
        ? new Date().toISOString()
        : null,
    }).eq("id", stock_out_id);

    // 4. Update Trade-in Items
    const { error: ttUpdateErr } = await supabase
      .from("trade_in_items")
      .update({
        description: tt_desc,
        estimated_value: tt_value,
      })
      .eq("deal_id", id);
    if (ttUpdateErr) throw ttUpdateErr;

    // Clean up old payments and finance ledger for this deal
    await supabase.from("payments").delete().eq("deal_id", id);
    await supabase.from("finance_ledger").delete().eq("ref_id", id);

    // Recreate payment & finance logs
    if (payment_amount > 0 && account_id) {
      if (payment_direction === "IN") {
        const { error: paymentErr } = await supabase.rpc("process_payment", {
          p_deal_id: id,
          p_account_id: account_id,
          p_amount: payment_amount,
          p_notes: `Tukar Tambah (Ubah) - Pembayaran Awal (${tt_desc})`,
          p_admin_id: user.id,
        });
        if (paymentErr) throw paymentErr;
      } else {
        // Insert Payment
        const { error: payErr } = await supabase
          .from("payments")
          .insert({
            deal_id: id,
            account_id: account_id,
            amount: payment_amount,
            payment_type: "OUT",
            status: "COMPLETED",
            notes: `Tukar Tambah (Ubah) - Kembalian Tunai (${tt_desc})`,
            handled_by: user.id,
          });
        if (payErr) throw payErr;

        // Insert Finance Ledger
        const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
          account_id: account_id,
          transaction_type: "PAYMENT_OUT",
          amount: -payment_amount,
          notes: `Tukar Tambah (Ubah) - Kembalian Tunai (${tt_desc})`,
          ref_id: id,
          created_by: user.id,
        });
        if (ledgerErr) throw ledgerErr;
      }
    }

    revalidatePath("/dashboard/trade-in");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/ledger");
  });
}

