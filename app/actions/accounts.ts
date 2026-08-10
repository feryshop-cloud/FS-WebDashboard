"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getAccounts() {
  return runAction("getAccounts", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching accounts", { error });
      throw new Error("Gagal memuat data rekening.");
    }

    return data;
  });
}

export async function addAccount(formData: FormData) {
  return runAction("addAccount", async () => {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const account_number = formData.get("account_number") as string;

    if (!name || !type) {
      throw new Error("Nama dan tipe rekening wajib diisi.");
    }

    const supabase = await createClient();

    const { error } = await supabase.from("accounts").insert({
      name,
      type,
      account_number,
      balance: 0,
      is_active: true,
    });

    if (error) {
      logger.error("Error adding account", { error });
      throw new Error("Gagal menambahkan rekening baru.");
    }

    revalidatePath("/dashboard/accounts");
  });
}

export async function transferBalance(formData: FormData) {
  return runAction("transferBalance", async () => {
    const from_account_id = formData.get("from_account_id") as string;
    const to_account_id = formData.get("to_account_id") as string;
    const amountStr = formData.get("amount") as string;
    const amount = parseFloat(amountStr);

    if (!from_account_id || !to_account_id || !amount || amount <= 0) {
      throw new Error("Data mutasi tidak valid. Pastikan nominal lebih dari 0.");
    }

    if (from_account_id === to_account_id) {
      throw new Error("Rekening asal dan tujuan tidak boleh sama.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // Using process_account_transfer RPC
    const { error } = await supabase.rpc("process_account_transfer", {
      p_source_account_id: from_account_id,
      p_dest_account_id: to_account_id,
      p_amount: amount,
      p_admin_fee: 0,
      p_admin_id: user.id,
    });

    if (error) {
      logger.error("Error in transferBalance", { error });
      throw new Error("Gagal melakukan mutasi saldo. Silakan coba lagi.");
    }

    revalidatePath("/dashboard/accounts");
  });
}

export async function updateAccount(id: string, formData: FormData) {
  return runAction("updateAccount", async () => {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const account_number = formData.get("account_number") as string;
    const is_active = formData.get("is_active") === "true";

    if (!id || !name || !type) {
      throw new Error("ID, nama, dan tipe rekening wajib diisi.");
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("accounts")
      .update({
        name,
        type,
        account_number,
        is_active,
      })
      .eq("id", id);

    if (error) {
      logger.error("Error updating account", { error });
      throw new Error("Gagal mengolah/mengubah data rekening.");
    }

    revalidatePath("/dashboard/accounts");
  });
}

export async function deleteAccount(id: string) {
  return runAction("deleteAccount", async () => {
    if (!id) {
      throw new Error("ID rekening wajib diisi.");
    }

    const supabase = await createClient();

    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting account", { error });
      throw new Error(
        "Gagal menghapus rekening. Rekening mungkin terikat dengan riwayat transaksi.",
      );
    }

    revalidatePath("/dashboard/accounts");
  });
}

export async function getBalanceAdjustments() {
  return runAction("getBalanceAdjustments", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("balance_adjustments")
      .select(`
        *,
        accounts (name),
        requested:users!requested_by (full_name),
        approved:users!approved_by (full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching balance adjustments", { error });
      throw new Error("Gagal memuat data penyesuaian saldo.");
    }

    return data;
  });
}

export async function requestBalanceAdjustment(formData: FormData) {
  return runAction("requestBalanceAdjustment", async () => {
    const account_id = formData.get("account_id") as string;
    const amountStr = formData.get("amount") as string;
    const notes = formData.get("notes") as string;
    const amount = parseFloat(amountStr);

    if (!account_id || isNaN(amount) || amount === 0 || !notes) {
      throw new Error("Data penyesuaian tidak valid. Nominal tidak boleh 0 dan alasan wajib diisi.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // Get current user's role
    const { data: userRole } = await supabase
      .from("users")
      .select("roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    const isOwner = userRole?.roles?.name === "OWNER";

    if (isOwner) {
      // Auto approve for OWNER role
      // 1. Insert approved balance adjustment record
      const { data: adj, error: adjErr } = await supabase
        .from("balance_adjustments")
        .insert({
          account_id,
          amount,
          notes,
          status: "APPROVED",
          requested_by: user.id,
          approved_by: user.id,
        })
        .select()
        .single();
      if (adjErr) throw adjErr;

      // 2. Insert finance ledger entry
      const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
        account_id,
        transaction_type: "ADJUSTMENT",
        amount,
        description: `Penyesuaian Saldo (Auto-Approve): ${notes}`,
        admin_id: user.id,
        ref_id: adj.id,
      });
      if (ledgerErr) throw ledgerErr;

      // 3. Update account balance
      const { data: accData } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", account_id)
        .single();
      
      if (accData) {
        const newBalance = Number(accData.balance) + amount;
        await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", account_id);
      }
    } else {
      // Create PENDING request for regular admin
      const { error: insertErr } = await supabase.from("balance_adjustments").insert({
        account_id,
        amount,
        notes,
        status: "PENDING",
        requested_by: user.id,
      });
      if (insertErr) throw insertErr;
    }

    revalidatePath("/dashboard/accounts");
  });
}

export async function approveBalanceAdjustment(id: string) {
  return runAction("approveBalanceAdjustment", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // Ensure user is OWNER
    const { data: userRole } = await supabase
      .from("users")
      .select("roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (userRole?.roles?.name !== "OWNER") {
      throw new Error("Hanya Owner yang memiliki wewenang untuk menyetujui penyesuaian saldo.");
    }

    // Fetch adjustment
    const { data: adj, error: fetchErr } = await supabase
      .from("balance_adjustments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !adj) {
      throw new Error("Data penyesuaian tidak ditemukan.");
    }

    if (adj.status !== "PENDING") {
      throw new Error("Penyesuaian ini sudah diproses sebelumnya.");
    }

    // 1. Insert finance ledger entry
    const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
      account_id: adj.account_id,
      transaction_type: "ADJUSTMENT",
      amount: adj.amount,
      description: `Penyesuaian Saldo (Disetujui): ${adj.notes}`,
      admin_id: adj.requested_by,
      ref_id: adj.id,
    });
    if (ledgerErr) throw ledgerErr;

    // 2. Update Account Balance
    const { data: accData } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", adj.account_id)
      .single();
    
    if (accData) {
      const newBalance = Number(accData.balance) + Number(adj.amount);
      await supabase
        .from("accounts")
        .update({ balance: newBalance })
        .eq("id", adj.account_id);
    }

    // 3. Update adjustment status to APPROVED
    const { error: updateErr } = await supabase
      .from("balance_adjustments")
      .update({
        status: "APPROVED",
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateErr) throw updateErr;

    revalidatePath("/dashboard/accounts");
  });
}

export async function rejectBalanceAdjustment(id: string) {
  return runAction("rejectBalanceAdjustment", async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Sesi tidak valid. Silakan login kembali.");
    }

    // Ensure user is OWNER
    const { data: userRole } = await supabase
      .from("users")
      .select("roles(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (userRole?.roles?.name !== "OWNER") {
      throw new Error("Hanya Owner yang memiliki wewenang untuk menolak penyesuaian saldo.");
    }

    const { error: updateErr } = await supabase
      .from("balance_adjustments")
      .update({
        status: "REJECTED",
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      logger.error("Error rejecting adjustment", { error: updateErr });
      throw new Error("Gagal menolak penyesuaian saldo.");
    }

    revalidatePath("/dashboard/accounts");
  });
}
