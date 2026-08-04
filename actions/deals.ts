"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/error";
import { logger } from "@/lib/logger";
import {
  DealWithRelations,
  Deal,
  DealStatus,
  PaymentStatus,
  PaymentType,
  PurchasePaymentStatus,
  StockStatus,
} from "@/types/database";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type DealItemRow = Database["public"]["Tables"]["deal_items"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type StockRow = Database["public"]["Tables"]["stocks"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

type DealQueryRow = DealRow & {
  customers: CustomerRow | null;
  deal_items: Array<DealItemRow & { stocks: StockRow | null }> | null;
  payments: Array<PaymentRow & { accounts: AccountRow | null }> | null;
  users: UserRow | null;
};

function mapRowToDealWithRelations(row: DealQueryRow): DealWithRelations {
  const stockRow = row.deal_items?.[0]?.stocks;
  const mappedStock = stockRow
    ? {
        id: stockRow.id,
        category: stockRow.category,
        name: stockRow.name,
        account_details: stockRow.account_detail,
        username: stockRow.login_info,
        password: stockRow.password_info,
        backup_code: stockRow.backup_code,
        capital_price: Number(stockRow.capital_price),
        post_price: Number(stockRow.post_price),
        promo_price: stockRow.promo_price ? Number(stockRow.promo_price) : null,
        current_price: Number(stockRow.current_price),
        status: stockRow.status as StockStatus,
        purchase_payment_status: (stockRow.purchase_payment_status ||
          "LUNAS") as PurchasePaymentStatus,
        payment_account_id: stockRow.payment_account_id || null,
        purchase_date: stockRow.purchase_date || null,
        post_date: stockRow.post_date || null,
        booking_date: stockRow.booking_date || null,
        sold_date: stockRow.sold_date || null,
        seller_info: stockRow.seller_info,
        buyer_info: stockRow.buyer_info || null,
        internal_notes: stockRow.notes,
        images: stockRow.images || [],
        admin_id: stockRow.managed_by,
        created_at: stockRow.created_at || "",
        updated_at: stockRow.updated_at || "",
      }
    : undefined;

  const mappedPayments = (row.payments || []).map((p) => ({
    id: p.id,
    deal_id: p.deal_id || "",
    account_id: p.account_id || "",
    amount: Number(p.amount),
    payment_type: p.payment_type as PaymentType,
    status: p.status as PaymentStatus,
    proof_url: p.proof_url || null,
    notes: p.notes || null,
    admin_id: p.handled_by || null,
    created_at: p.created_at || "",
    updated_at: p.updated_at || "",
    account: p.accounts
      ? {
          id: p.accounts.id,
          name: p.accounts.name,
          account_number: p.accounts.account_number,
          balance: Number(p.accounts.balance),
          is_active: p.accounts.is_active || false,
          created_at: p.accounts.created_at || "",
          updated_at: p.accounts.updated_at || "",
        }
      : undefined,
  }));

  const dealPrice = Number(row.total_deal_price || 0);
  const totalPaid = Number(row.total_paid || 0);

  return {
    id: row.id,
    deal_number: row.deal_number,
    customer_name: row.customers?.name || "",
    customer_contact: row.customers?.phone || null,
    stock_id: row.deal_items?.[0]?.stock_id || "",
    deal_price: dealPrice,
    total_paid: totalPaid,
    remaining_balance: dealPrice - totalPaid,
    payment_percentage: dealPrice > 0 ? (totalPaid / dealPrice) * 100 : 0,
    status: row.status as DealStatus,
    due_date: row.due_date,
    notes: row.notes,
    admin_id: row.handled_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    stock: mappedStock,
    payments: mappedPayments,
    admin: row.users
      ? {
          id: row.users.id,
          full_name: row.users.full_name,
          role_id: row.users.role_id,
          is_active: row.users.status === "Aktif",
          created_at: row.users.created_at || "",
          updated_at: row.users.updated_at || "",
        }
      : undefined,
  };
}

export async function getDeals(): Promise<{
  data: DealWithRelations[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select("*, customers(*), deal_items(*, stocks(*)), payments(*, accounts(*)), users(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = ((data || []) as DealQueryRow[]).map(mapRowToDealWithRelations);
    return { data: mapped, error: null };
  } catch (error: unknown) {
    logger.error("Error fetching deals", { error });
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDealById(
  id: string,
): Promise<{ data: DealWithRelations | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select("*, customers(*), deal_items(*, stocks(*)), payments(*, accounts(*)), users(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data: mapRowToDealWithRelations(data as DealQueryRow), error: null };
  } catch (error: unknown) {
    logger.error("Error fetching deal", { error });
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDeal(
  stockId: string,
  customerName: string,
  customerContact: string,
  dealPrice: number,
): Promise<{ data: Deal | null; error: string | null }> {
  try {
    if (dealPrice <= 0) {
      return { data: null, error: "Harga deal harus lebih besar dari 0" };
    }
    if (!customerName.trim()) {
      return { data: null, error: "Nama customer wajib diisi" };
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { data: null, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    // 1. Find or create customer
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("name", customerName)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerErr } = await supabase
        .from("customers")
        .insert({ name: customerName, phone: customerContact })
        .select()
        .single();
      if (customerErr) throw customerErr;
      customerId = newCustomer.id;
    }

    // 2. Insert Deal
    const dealNumber = `DEAL-${Date.now()}`;
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert({
        deal_number: dealNumber,
        customer_id: customerId,
        deal_type: "Penjualan",
        total_deal_price: dealPrice,
        total_paid: 0,
        status: "DRAFT",
        handled_by: adminId,
      })
      .select()
      .single();
    if (dealErr) throw dealErr;

    // 3. Insert Deal Item
    const { error: itemErr } = await supabase.from("deal_items").insert({
      deal_id: deal.id,
      stock_id: stockId,
      price: dealPrice,
    });
    if (itemErr) throw itemErr;

    const mappedDeal: Deal = {
      id: deal.id,
      deal_number: deal.deal_number,
      customer_name: customerName,
      customer_contact: customerContact || null,
      stock_id: stockId,
      deal_price: Number(deal.total_deal_price),
      total_paid: Number(deal.total_paid),
      remaining_balance: Number(deal.total_deal_price) - Number(deal.total_paid),
      payment_percentage: 0,
      status: deal.status as DealStatus,
      due_date: deal.due_date,
      notes: deal.notes,
      admin_id: deal.handled_by,
      created_at: deal.created_at || "",
      updated_at: deal.updated_at || "",
    };

    revalidatePath("/dashboard/deals", "page");
    return { data: mappedDeal, error: null };
  } catch (error: unknown) {
    logger.error("Error creating deal", { error });
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function addPayment(
  dealId: string,
  accountId: string,
  amount: number,
  notes: string = "",
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (amount <= 0) {
      return { success: false, error: "Jumlah pembayaran harus lebih besar dari 0" };
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    const { error } = await supabase.rpc("process_payment", {
      p_deal_id: dealId,
      p_account_id: accountId,
      p_amount: amount,
      p_notes: notes,
      p_admin_id: adminId,
    });

    if (error) throw error;

    revalidatePath("/dashboard/deals");
    revalidatePath(`/dashboard/deals/${dealId}`);
    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error("Error processing payment", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function cancelDeal(
  dealId: string,
  stockId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error: dealError } = await supabase
      .from("deals")
      .update({
        status: "CANCELLED_BY_BUYER",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dealId);

    if (dealError) throw dealError;

    const { error: stockError } = await supabase
      .from("stocks")
      .update({ status: "AVAILABLE", updated_at: new Date().toISOString() })
      .eq("id", stockId);

    if (stockError) throw stockError;

    revalidatePath("/dashboard/deals");
    revalidatePath(`/dashboard/deals/${dealId}`);
    revalidatePath("/dashboard/inventory");

    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error("Error cancelling deal", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}
