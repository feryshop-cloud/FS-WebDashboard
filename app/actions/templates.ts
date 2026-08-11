"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getTemplates() {
  return runAction("getTemplates", async () => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)("promotional_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching promotional templates", { error });
      return [];
    }

    return data || [];
  });
}

export async function getInventoryForCaption() {
  return runAction("getInventoryForCaption", async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory")
      .select("id, public_id, title_reference, account_specs, asking_price, status, games(name)")
      .in("status", ["UNPOSTED", "AVAILABLE"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Error fetching inventory for caption generation", { error });
      return [];
    }

    return data || [];
  });
}

export async function addTemplate(formData: FormData) {
  return runAction("addTemplate", async () => {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const content = formData.get("content") as string;

    if (!name || !type || !content) {
      throw new Error("Nama, tipe, dan isi template wajib diisi.");
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("promotional_templates").insert({
      name,
      type,
      content,
    });

    if (error) {
      logger.error("Error adding template", { error });
      throw new Error("Gagal membuat template promosi.");
    }

    revalidatePath("/dashboard/templates");
  });
}

export async function updateTemplate(id: string, formData: FormData) {
  return runAction("updateTemplate", async () => {
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const content = formData.get("content") as string;

    if (!id || !name || !type || !content) {
      throw new Error("ID, nama, tipe, dan isi template wajib diisi.");
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("promotional_templates")
      .update({
        name,
        type,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error updating template", { error });
      throw new Error("Gagal mengolah/mengubah template promosi.");
    }

    revalidatePath("/dashboard/templates");
  });
}

export async function deleteTemplate(id: string) {
  return runAction("deleteTemplate", async () => {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("promotional_templates").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting template", { error });
      throw new Error("Gagal menghapus template promosi.");
    }

    revalidatePath("/dashboard/templates");
  });
}
