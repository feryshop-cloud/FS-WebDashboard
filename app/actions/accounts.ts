"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import { getErrorMessage } from "@/lib/error";
import type { ActionResult } from "@/lib/action-result";

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

export async function addAccount(formData: FormData): Promise<ActionResult> {
  return runAction("addAccount", async () => {
    try {
      const name = formData.get("name") as string;
      const type = formData.get("type") as string;
      const account_number = formData.get("account_number") as string;

      if (!name || !type) {
        return { success: false, error: "Nama dan tipe rekening wajib diisi." };
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
        return { success: false, error: "Gagal menambahkan rekening baru: " + error.message };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("addAccount exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal menambahkan rekening baru."),
      };
    }
  });
}

export async function transferBalance(formData: FormData): Promise<ActionResult> {
  return runAction("transferBalance", async () => {
    try {
      const from_account_id = formData.get("from_account_id") as string;
      const to_account_id = formData.get("to_account_id") as string;
      const amountStr = formData.get("amount") as string;
      const amount = parseFloat(amountStr);

      if (!from_account_id || !to_account_id || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Data mutasi tidak valid. Pastikan nominal lebih dari 0." };
      }

      if (from_account_id === to_account_id) {
        return { success: false, error: "Rekening asal dan tujuan tidak boleh sama." };
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
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
        return {
          success: false,
          error: error.message || "Gagal melakukan mutasi saldo. Silakan coba lagi.",
        };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("transferBalance exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal melakukan mutasi saldo. Silakan coba lagi."),
      };
    }
  });
}

export async function updateAccount(id: string, formData: FormData): Promise<ActionResult> {
  return runAction("updateAccount", async () => {
    try {
      const name = formData.get("name") as string;
      const type = formData.get("type") as string;
      const account_number = formData.get("account_number") as string;
      const is_active = formData.get("is_active") === "true";

      if (!id || !name || !type) {
        return { success: false, error: "ID, nama, dan tipe rekening wajib diisi." };
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
        return { success: false, error: "Gagal mengolah/mengubah data rekening: " + error.message };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("updateAccount exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal mengolah/mengubah data rekening."),
      };
    }
  });
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  return runAction("deleteAccount", async () => {
    try {
      if (!id) {
        return { success: false, error: "ID rekening wajib diisi." };
      }

      const supabase = await createClient();

      const { error } = await supabase.from("accounts").delete().eq("id", id);

      if (error) {
        logger.error("Error deleting account", { error });
        return {
          success: false,
          error:
            "Gagal menghapus rekening. Rekening mungkin terikat dengan riwayat transaksi atau kas.",
        };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("deleteAccount exception", { err });
      return {
        success: false,
        error: getErrorMessage(
          err,
          "Gagal menghapus rekening. Rekening mungkin terikat dengan riwayat transaksi.",
        ),
      };
    }
  });
}

export async function getBalanceAdjustments() {
  return runAction("getBalanceAdjustments", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("balance_adjustments")
      .select(
        `
        *,
        accounts (name),
        requested:users!requested_by (full_name),
        approved:users!approved_by (full_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching balance adjustments", { error });
      throw new Error("Gagal memuat data penyesuaian saldo.");
    }

    return data;
  });
}

export async function requestBalanceAdjustment(formData: FormData): Promise<ActionResult> {
  return runAction("requestBalanceAdjustment", async () => {
    try {
      const account_id = formData.get("account_id") as string;
      const amountStr = formData.get("amount") as string;
      const notes = formData.get("notes") as string;
      const amount = parseFloat(amountStr);

      if (!account_id || isNaN(amount) || amount === 0 || !notes) {
        return {
          success: false,
          error: "Data penyesuaian tidak valid. Nominal tidak boleh 0 dan alasan wajib diisi.",
        };
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
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
        if (adjErr) {
          logger.error("Error creating balance adjustment", { error: adjErr });
          return {
            success: false,
            error: "Gagal membuat penyesuaian saldo: " + adjErr.message,
          };
        }

        // 2. Insert finance ledger entry
        const { error: ledgerErr } = await supabase.from("finance_ledger").insert({
          account_id,
          transaction_type: "ADJUSTMENT",
          amount,
          description: `Penyesuaian Saldo (Auto-Approve): ${notes}`,
          admin_id: user.id,
          ref_id: adj.id,
        });
        if (ledgerErr) {
          logger.error("Error creating ledger entry", { error: ledgerErr });
          return {
            success: false,
            error: "Gagal mencatat mutasi ledger: " + ledgerErr.message,
          };
        }

        // 3. Update account balance
        const { data: accData, error: accErr } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", account_id)
          .single();

        if (accErr) {
          logger.error("Error fetching account", { error: accErr });
          return {
            success: false,
            error: "Gagal mengambil data rekening: " + accErr.message,
          };
        }

        if (accData) {
          const newBalance = Number(accData.balance) + amount;
          const { error: updateAccErr } = await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", account_id);
          if (updateAccErr) {
            logger.error("Error updating account balance", { error: updateAccErr });
            return {
              success: false,
              error: "Gagal memperbarui saldo rekening: " + updateAccErr.message,
            };
          }
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
        if (insertErr) {
          logger.error("Error creating adjustment request", { error: insertErr });
          return {
            success: false,
            error: "Gagal mengajukan penyesuaian saldo: " + insertErr.message,
          };
        }
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("requestBalanceAdjustment exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal memproses penyesuaian saldo."),
      };
    }
  });
}

export async function approveBalanceAdjustment(id: string): Promise<ActionResult> {
  return runAction("approveBalanceAdjustment", async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      // Ensure user is OWNER
      const { data: userRole } = await supabase
        .from("users")
        .select("roles(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (userRole?.roles?.name !== "OWNER") {
        return {
          success: false,
          error: "Hanya Owner yang memiliki wewenang untuk menyetujui penyesuaian saldo.",
        };
      }

      // Fetch adjustment
      const { data: adj, error: fetchErr } = await supabase
        .from("balance_adjustments")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !adj) {
        return { success: false, error: "Data penyesuaian tidak ditemukan." };
      }

      if (adj.status !== "PENDING") {
        return { success: false, error: "Penyesuaian ini sudah diproses sebelumnya." };
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
      if (ledgerErr) {
        logger.error("Error inserting ledger entry", { error: ledgerErr });
        return {
          success: false,
          error: "Gagal mencatat mutasi ledger: " + ledgerErr.message,
        };
      }

      // 2. Update Account Balance
      const { data: accData, error: accErr } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", adj.account_id)
        .single();

      if (accErr) {
        logger.error("Error fetching account", { error: accErr });
        return {
          success: false,
          error: "Gagal mengambil data rekening: " + accErr.message,
        };
      }

      if (accData) {
        const newBalance = Number(accData.balance) + Number(adj.amount);
        const { error: updateAccErr } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", adj.account_id);
        if (updateAccErr) {
          logger.error("Error updating account balance", { error: updateAccErr });
          return {
            success: false,
            error: "Gagal memperbarui saldo rekening: " + updateAccErr.message,
          };
        }
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
      if (updateErr) {
        logger.error("Error updating adjustment status", { error: updateErr });
        return {
          success: false,
          error: "Gagal memperbarui status penyesuaian: " + updateErr.message,
        };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("approveBalanceAdjustment exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal menyetujui penyesuaian saldo."),
      };
    }
  });
}

export async function rejectBalanceAdjustment(id: string): Promise<ActionResult> {
  return runAction("rejectBalanceAdjustment", async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
      }

      // Ensure user is OWNER
      const { data: userRole } = await supabase
        .from("users")
        .select("roles(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (userRole?.roles?.name !== "OWNER") {
        return {
          success: false,
          error: "Hanya Owner yang memiliki wewenang untuk menolak penyesuaian saldo.",
        };
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
        return {
          success: false,
          error: "Gagal menolak penyesuaian saldo: " + updateErr.message,
        };
      }

      revalidatePath("/dashboard/accounts");
      return { success: true };
    } catch (err: unknown) {
      logger.error("rejectBalanceAdjustment exception", { err });
      return {
        success: false,
        error: getErrorMessage(err, "Gagal menolak penyesuaian saldo."),
      };
    }
  });
}
