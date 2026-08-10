"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

export type EmailAccountRow = Database["public"]["Tables"]["email_accounts"]["Row"];

function revalidate() {
  revalidatePath("/dashboard/mail-accounts", "page");
  revalidatePath("/dashboard/ferrymail", "page");
}

export async function getEmailAccounts() {
  return runAction("getEmailAccounts", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("email_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching email accounts", { error });
      return [] as EmailAccountRow[];
    }

    return (data || []) as EmailAccountRow[];
  });
}

export async function createEmailAccount(formData: FormData) {
  return runAction("createEmailAccount", async () => {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const displayName = String(formData.get("display_name") || "").trim() || null;
    const isActive = formData.get("is_active") === "on";

    if (!email) {
      throw new Error("Alamat email wajib diisi.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("email_accounts").insert({
      email,
      display_name: displayName,
      is_active: isActive,
    });

    if (error) {
      logger.error("Error creating email account", { error });
      throw new Error(
        error.message.includes("duplicate")
          ? "Email akun sudah terdaftar."
          : "Gagal membuat akun email.",
      );
    }

    revalidate();
  });
}

export async function updateEmailAccount(id: string, formData: FormData) {
  return runAction("updateEmailAccount", async () => {
    if (!id) throw new Error("ID akun wajib diisi.");

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const displayName = String(formData.get("display_name") || "").trim() || null;
    const isActive = formData.get("is_active") === "on";

    if (!email) {
      throw new Error("Alamat email wajib diisi.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("email_accounts").update({
      email,
      display_name: displayName,
      is_active: isActive,
    }).eq("id", id);

    if (error) {
      logger.error("Error updating email account", { error });
      throw new Error(
        error.message.includes("duplicate")
          ? "Email akun sudah terdaftar."
          : "Gagal memperbarui akun email.",
      );
    }

    revalidate();
  });
}

export async function deleteEmailAccount(id: string) {
  return runAction("deleteEmailAccount", async () => {
    if (!id) throw new Error("ID akun wajib diisi.");

    const supabase = await createClient();
    const { error } = await supabase.from("email_accounts").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting email account", { error });
      throw new Error("Gagal menghapus akun email.");
    }

    revalidate();
  });
}
