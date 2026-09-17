"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";
import { revalidatePath } from "next/cache";
import { encryptCredential, decryptCredential } from "@/lib/crypto";
import type { GmailAccount, GmailAccountStatus, GmailAccountStatusLog } from "@/types/database";

function revalidate() {
  revalidatePath("/dashboard/gmail-accounts", "page");
}

/**
 * Mendapatkan user ID admin saat ini jika terdaftar di tabel public.users
 * untuk memenuhi foreign key constraint.
 */
async function resolveCurrentAdminId(supabase: any): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return null;

    const { data: userRecord } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    return userRecord ? user.id : null;
  } catch {
    return null;
  }
}

export async function getGmailAccounts(): Promise<GmailAccount[]> {
  return runAction("getGmailAccounts", async () => {
    const supabase = await createClient();

    // Query data akun berserta relasi managed_by ke users
    const { data, error } = await (supabase as any)
      .from("gmail_accounts")
      .select("*, manager:users!gmail_accounts_managed_by_fkey(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback jika foreign key join gagal
      logger.warn("Join with users failed, fetching without join", { error: error.message });
      const { data: fallbackData, error: fallbackError } = await (supabase as any)
        .from("gmail_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (fallbackError) {
        logger.error("Error fetching gmail accounts", { error: fallbackError });
        return [];
      }

      return ((fallbackData || []) as any[]).map((row) => ({
        ...row,
        google_password: decryptCredential(row.google_password),
        backup_codes: decryptCredential(row.backup_codes),
      })) as unknown as GmailAccount[];
    }

    return ((data || []) as any[]).map((row) => ({
      ...row,
      google_password: decryptCredential(row.google_password),
      backup_codes: decryptCredential(row.backup_codes),
    })) as unknown as GmailAccount[];
  });
}

export async function createGmailAccount(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  return runAction("createGmailAccount", async () => {
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const rawPassword = String(formData.get("google_password") || "").trim();
    const rawBackupCodes = String(formData.get("backup_codes") || "").trim();
    const notes = String(formData.get("notes") || "").trim() || null;
    const status = (String(formData.get("status") || "Belum diamankan").trim() ||
      "Belum diamankan") as GmailAccountStatus;

    if (!email) {
      return { success: false, error: "Alamat email Gmail wajib diisi." };
    }

    const supabase = await createClient();
    const adminId = await resolveCurrentAdminId(supabase);

    const encryptedPassword = encryptCredential(rawPassword);
    const encryptedBackupCodes = encryptCredential(rawBackupCodes);

    const { error } = await (supabase as any).from("gmail_accounts").insert({
      email,
      google_password: encryptedPassword,
      backup_codes: encryptedBackupCodes,
      notes,
      status,
      managed_by: adminId,
    });

    if (error) {
      logger.error("Error creating gmail account", { error });
      return {
        success: false,
        error: error.message.includes("relation")
          ? "Tabel database belum siap. Pastikan migrasi telah diterapkan."
          : `Gagal menambahkan akun Gmail: ${error.message}`,
      };
    }

    revalidate();
    return { success: true };
  });
}

export async function createBulkGmailAccounts(
  accounts: Array<{
    email: string;
    google_password?: string;
    backup_codes?: string;
    notes?: string;
    status?: GmailAccountStatus;
  }>,
): Promise<{ success: boolean; count?: number; error?: string }> {
  return runAction("createBulkGmailAccounts", async () => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return { success: false, error: "Daftar akun Gmail tidak boleh kosong." };
    }

    const supabase = await createClient();
    const adminId = await resolveCurrentAdminId(supabase);

    const rowsToInsert = [];
    for (const item of accounts) {
      const email = String(item.email || "")
        .trim()
        .toLowerCase();
      if (!email) continue;

      const rawPassword = String(item.google_password || "").trim();
      const rawBackupCodes = String(item.backup_codes || "").trim();
      const notes = String(item.notes || "").trim() || null;
      const status = (String(item.status || "Belum diamankan").trim() ||
        "Belum diamankan") as GmailAccountStatus;

      rowsToInsert.push({
        email,
        google_password: encryptCredential(rawPassword),
        backup_codes: encryptCredential(rawBackupCodes),
        notes,
        status,
        managed_by: adminId,
      });
    }

    if (rowsToInsert.length === 0) {
      return { success: false, error: "Tidak ada alamat email valid yang dapat disimpan." };
    }

    const { error } = await (supabase as any).from("gmail_accounts").insert(rowsToInsert);

    if (error) {
      logger.error("Error bulk creating gmail accounts", { error });
      return {
        success: false,
        error: error.message.includes("relation")
          ? "Tabel database belum siap. Pastikan migrasi telah diterapkan."
          : `Gagal menambahkan akun Gmail massal: ${error.message}`,
      };
    }

    revalidate();
    return { success: true, count: rowsToInsert.length };
  });
}

export async function updateGmailAccount(
  id: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  return runAction("updateGmailAccount", async () => {
    if (!id) {
      return { success: false, error: "ID akun wajib diisi." };
    }

    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const rawPassword = String(formData.get("google_password") || "").trim();
    const rawBackupCodes = String(formData.get("backup_codes") || "").trim();
    const notes = String(formData.get("notes") || "").trim() || null;
    const status = (String(formData.get("status") || "Belum diamankan").trim() ||
      "Belum diamankan") as GmailAccountStatus;

    if (!email) {
      return { success: false, error: "Alamat email Gmail wajib diisi." };
    }

    const supabase = await createClient();
    const adminId = await resolveCurrentAdminId(supabase);

    const encryptedPassword = encryptCredential(rawPassword);
    const encryptedBackupCodes = encryptCredential(rawBackupCodes);

    const { error } = await (supabase as any)
      .from("gmail_accounts")
      .update({
        email,
        google_password: encryptedPassword,
        backup_codes: encryptedBackupCodes,
        notes,
        status,
        managed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error updating gmail account", { error });
      return { success: false, error: `Gagal memperbarui akun Gmail: ${error.message}` };
    }

    revalidate();
    return { success: true };
  });
}

export async function updateGmailAccountStatus(
  id: string,
  newStatus: GmailAccountStatus,
  statusNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  return runAction("updateGmailAccountStatus", async () => {
    if (!id) {
      return { success: false, error: "ID akun wajib diisi." };
    }

    const supabase = await createClient();
    const adminId = await resolveCurrentAdminId(supabase);

    const updatePayload: Record<string, any> = {
      status: newStatus,
      managed_by: adminId,
      updated_at: new Date().toISOString(),
    };

    if (statusNotes !== undefined) {
      updatePayload.notes = statusNotes;
    }

    const { error } = await (supabase as any)
      .from("gmail_accounts")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      logger.error("Error updating gmail account status", { error });
      return { success: false, error: `Gagal mengubah status akun Gmail: ${error.message}` };
    }

    revalidate();
    return { success: true };
  });
}

export async function deleteGmailAccount(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return runAction("deleteGmailAccount", async () => {
    if (!id) {
      return { success: false, error: "ID akun wajib diisi." };
    }

    const supabase = await createClient();
    const { error } = await (supabase as any).from("gmail_accounts").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting gmail account", { error });
      return { success: false, error: "Gagal menghapus akun Gmail." };
    }

    revalidate();
    return { success: true };
  });
}

export async function getGmailAccountStatusLogs(
  accountId: string,
): Promise<GmailAccountStatusLog[]> {
  return runAction("getGmailAccountStatusLogs", async () => {
    if (!accountId) return [];

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("gmail_account_status_logs")
      .select("*, changer:users!gmail_account_status_logs_changed_by_fkey(id, full_name, email)")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback tanpa join
      logger.warn("Join with users for status logs failed, fetching raw", { error: error.message });
      const { data: fallbackData, error: fallbackError } = await (supabase as any)
        .from("gmail_account_status_logs")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });

      if (fallbackError) {
        logger.error("Error fetching gmail status logs", { error: fallbackError });
        return [];
      }

      return (fallbackData || []) as unknown as GmailAccountStatusLog[];
    }

    return (data || []) as unknown as GmailAccountStatusLog[];
  });
}
