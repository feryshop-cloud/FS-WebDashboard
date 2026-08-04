"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { Account } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getAccounts(): Promise<{ data: Account[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as unknown as Account[], error: null };
  } catch (error) {
    logger.error("Error fetching accounts", { error });
    return {
      data: null,
      error: (error as { message?: string }).message || "An unexpected error occurred",
    };
  }
}

export async function createAccount(
  accountData: Partial<Account>,
): Promise<{ data: Account | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        name: accountData.name || "",
        type: "BANK",
        account_number: accountData.account_number || null,
        balance: accountData.balance ?? 0,
        is_active: accountData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/finance", "page");
    revalidatePath("/dashboard/accounts", "page");
    return { data: data as unknown as Account, error: null };
  } catch (error) {
    logger.error("Error creating account", { error });
    return {
      data: null,
      error: (error as { message?: string }).message || "An unexpected error occurred",
    };
  }
}

export async function transferFunds(
  sourceAccountId: string,
  destAccountId: string,
  amount: number,
  adminFee: number,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    if (amount <= 0) {
      return { success: false, error: "Nominal transfer harus lebih besar dari 0" };
    }
    if (adminFee < 0) {
      return { success: false, error: "Biaya admin tidak boleh negatif" };
    }
    if (sourceAccountId === destAccountId) {
      return { success: false, error: "Rekening asal dan tujuan tidak boleh sama" };
    }

    const { error } = await supabase.rpc("process_account_transfer", {
      p_source_account_id: sourceAccountId,
      p_dest_account_id: destAccountId,
      p_amount: amount,
      p_admin_fee: adminFee,
      p_admin_id: adminId,
    });

    if (error) throw error;

    revalidatePath("/dashboard/accounts", "page");
    revalidatePath("/dashboard/ledger", "page");

    return { success: true, error: null };
  } catch (error) {
    logger.error("Error in transferFunds", { error });
    return {
      success: false,
      error: (error as { message?: string }).message || "Gagal memproses transfer",
    };
  }
}
