"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export interface IncomingEmailRow {
  id: string;
  recipient_email: string;
  sender_email: string;
  subject: string | null;
  message_id: string;
  otp_code: string | null;
  raw_body_snippet: string | null;
  category: string | null;
  visibility: string;
  is_read: boolean;
  is_archived: boolean;
  received_at: string;
  email_account_id: string | null;
}

export async function setIncomingEmailsArchived(ids: string[], archived: boolean) {
  return runAction("setIncomingEmailsArchived", async () => {
    if (!ids || ids.length === 0) {
      throw new Error("Tidak ada email yang dipilih.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("incoming_emails")
      .update({ is_archived: archived })
      .in("id", ids);

    if (error) {
      logger.error("Error setting incoming emails archived", { error, archived });
      throw new Error("Gagal mengubah status arsip email.");
    }
  });
}

export async function markIncomingEmailsRead(ids: string[]) {
  return runAction("markIncomingEmailsRead", async () => {
    if (!ids || ids.length === 0) {
      throw new Error("Tidak ada email yang dipilih.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("incoming_emails")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      logger.error("Error marking incoming emails as read", { error });
      throw new Error("Gagal menandai email sudah dibaca.");
    }
  });
}

export async function deleteIncomingEmails(ids: string[]) {
  return runAction("deleteIncomingEmails", async () => {
    if (!ids || ids.length === 0) {
      throw new Error("Tidak ada email yang dipilih.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("incoming_emails").delete().in("id", ids);

    if (error) {
      logger.error("Error deleting incoming emails", { error });
      throw new Error("Gagal menghapus email.");
    }
  });
}

export async function getIncomingEmailById(id: string) {
  return runAction("getIncomingEmailById", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incoming_emails")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching incoming email by id", { error, id });
      return null;
    }

    return (data || null) as IncomingEmailRow | null;
  });
}

export async function getIncomingEmails(accountId?: string) {
  return runAction("getIncomingEmails", async () => {
    const supabase = await createClient();
    let query = supabase.from("incoming_emails").select("*");

    if (accountId) {
      query = query.eq("email_account_id", accountId);
    }

    const { data, error } = await query.order("received_at", { ascending: false });

    if (error) {
      logger.error("Error fetching incoming emails", { error });
      return [] as IncomingEmailRow[];
    }

    return (data || []) as IncomingEmailRow[];
  });
}
