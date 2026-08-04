"use server";

import { createClient } from "@/lib/supabase/server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import type { Database } from "@/types/database.types";

type LedgerTransactionType = Database["public"]["Enums"]["ledger_transaction_type"];


export async function getLedgers(page?: number, limit?: number, accountId?: string) {
  return runAction("getLedgers", async () => {
    const supabase = await createClient();

    let query = supabase
      .from("finance_ledger")
      .select(
        `
          *,
          accounts (
            name
          )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (page && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error("Error fetching ledgers", { error });
      throw new Error("Gagal memuat riwayat transaksi kas.");
    }

    return { data: data || [], totalCount: count || 0 };
  });
}

export async function addManualLedger(formData: FormData) {
  return runAction("addManualLedger", async () => {
    const amount = parseFloat(formData.get("amount") as string);
    const transaction_type = formData.get("transaction_type") as string;
    const notes = formData.get("notes") as string;
    const account_id = formData.get("account_id") as string;

    if (!amount || !transaction_type || !account_id) {
      throw new Error("Nominal, tipe transaksi, dan rekening wajib diisi.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("finance_ledger").insert({
      amount: transaction_type === "PAYMENT_OUT" || transaction_type === "REFUND" ? -Math.abs(amount) : Math.abs(amount),
      transaction_type: transaction_type as LedgerTransactionType,
      notes: notes || "Input Kas Manual",
      account_id,
      admin_id: user?.id,
    });


    if (error) {
      logger.error("Error adding manual ledger", { error });
      throw new Error("Gagal mencatat transaksi kas.");
    }

    revalidatePath("/dashboard/ledger");
    revalidatePath("/dashboard/accounts");
  });
}

export async function updateLedger(id: string, formData: FormData) {
  return runAction("updateLedger", async () => {
    const notes = formData.get("notes") as string;

    const supabase = await createClient();

    const { error } = await supabase
      .from("finance_ledger")
      .update({ notes })
      .eq("id", id);

    if (error) {
      logger.error("Error updating ledger", { error });
      throw new Error("Gagal mengolah data kas.");
    }

    revalidatePath("/dashboard/ledger");
  });
}

export async function deleteLedger(id: string) {
  return runAction("deleteLedger", async () => {
    const supabase = await createClient();

    const { error } = await supabase.from("finance_ledger").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting ledger", { error });
      throw new Error("Gagal menghapus entri kas.");
    }

    revalidatePath("/dashboard/ledger");
    revalidatePath("/dashboard/accounts");
  });
}

