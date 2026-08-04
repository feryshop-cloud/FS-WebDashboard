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
