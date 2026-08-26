"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { purgeStorefront, STOREFRONT_TAGS } from "@/lib/store-revalidate";
import { InventoryFormSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getInventory() {
  return runAction("getInventory", async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory")
      .select(
        `
          *,
          games (
            id,
            name,
            slug
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching inventory", { error });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  });
}

export async function getGames() {
  return runAction("getGames", async () => {
    const supabase = await createClient();

    const { data, error } = await supabase.from("games").select("id, name, slug").order("name");

    if (error) {
      logger.error("Error fetching games", { error });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  });
}

export async function addInventoryItem(formData: FormData) {
  return runAction("addInventoryItem", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      game_id: formData.get("game_id"),
      title_reference: formData.get("title_reference"),
      account_specs: formData.get("account_specs"),
      capital_price: formData.get("capital_price"),
      asking_price: formData.get("asking_price"),
    };

    const parsed = InventoryFormSchema.safeParse(rawData);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    let image_urls: string[] = [];
    const imageFiles = formData.getAll("images") as File[];

    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file, index) => {
        if (file.size > 0) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const fileBody = await file.arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("screenshots")
            .upload(fileName, fileBody, { contentType: file.type, upsert: true });

          if (uploadError) {
            logger.error("Supabase Storage Error", { error: uploadError });
            throw new Error("Failed to upload screenshot.");
          }

          const { data: publicUrlData } = supabase.storage
            .from("screenshots")
            .getPublicUrl(fileName);

          return publicUrlData.publicUrl;
        }
        return null;
      });

      try {
        const urls = await Promise.all(uploadPromises);
        image_urls = urls.filter((url): url is string => url !== null);
      } catch {
        return {
          success: false,
          error: "Gagal meng-upload satu atau lebih screenshot. Silakan coba lagi.",
        };
      }
    }

    const screenshot_url = image_urls.length > 0 ? image_urls[0] : "";
    const status = (formData.get("status") as "UNPOSTED" | "AVAILABLE" | "SOLD") || "AVAILABLE";

    const { error } = await supabase.from("inventory").insert({
      game_id: parsed.data.game_id,
      title_reference: parsed.data.title_reference,
      account_specs: parsed.data.account_specs,
      capital_price: parsed.data.capital_price,
      asking_price: parsed.data.asking_price,
      screenshot_url: screenshot_url,
      image_urls: image_urls,
      status: status,
      added_by: user.id,
      public_id: null as any,
    });

    if (error) {
      logger.error("Database Error", { error });
      return { success: false, error: "Failed to insert into database." };
    }

    revalidatePath("/dashboard/inventory");
    purgeStorefront(STOREFRONT_TAGS.marketplace);
    return { success: true };
  });
}

export async function updateItemStatus(id: string, newStatus: "UNPOSTED" | "AVAILABLE" | "SOLD") {
  return runAction("updateItemStatus", async () => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("inventory")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      logger.error("Error updating status", { error });
      return { success: false, error: "Failed to update item status." };
    }

    revalidatePath("/dashboard/inventory");
    purgeStorefront(STOREFRONT_TAGS.marketplace);
    return { success: true };
  });
}

export async function markItemAsSold(id: string, soldPrice: number) {
  return runAction("markItemAsSold", async () => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("inventory")
      .update({
        status: "SOLD",
        sold_price: soldPrice,
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("Error marking as sold", { error });
      return { success: false, error: "Failed to mark item as sold." };
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    purgeStorefront(STOREFRONT_TAGS.marketplace);
    return { success: true };
  });
}

export async function updateInventoryItem(id: string, formData: FormData) {
  return runAction("updateInventoryItem", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const game_id = formData.get("game_id") as string;
    const title_reference = formData.get("title_reference") as string;
    const account_specs = formData.get("account_specs") as string;
    const capital_price = Number(formData.get("capital_price"));
    const asking_price = Number(formData.get("asking_price"));
    const status = (formData.get("status") as "UNPOSTED" | "AVAILABLE" | "SOLD") || undefined;

    if (!game_id || !title_reference || isNaN(capital_price) || isNaN(asking_price)) {
      return { success: false, error: "Data form tidak lengkap atau tidak valid." };
    }

    // Handle existing images passed from the form
    let retained_urls: string[] = [];
    const existingImagesRaw = formData.getAll("existing_images");
    if (existingImagesRaw.length > 0) {
      retained_urls = existingImagesRaw.filter(
        (u): u is string => typeof u === "string" && u.length > 0,
      );
    } else {
      const singleExisting = formData.get("existing_images");
      if (typeof singleExisting === "string" && singleExisting) {
        try {
          const parsed = JSON.parse(singleExisting);
          if (Array.isArray(parsed)) {
            retained_urls = parsed.filter(Boolean);
          }
        } catch {
          retained_urls = [singleExisting];
        }
      }
    }

    // Handle new uploaded image files
    let new_uploaded_urls: string[] = [];
    const newImageFiles = (formData.getAll("images") as File[]).filter((f) => f && f.size > 0);

    if (newImageFiles.length > 0) {
      const uploadPromises = newImageFiles.map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const fileBody = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("screenshots")
          .upload(fileName, fileBody, { contentType: file.type, upsert: true });

        if (uploadError) {
          logger.error("Supabase Storage Error during update", { error: uploadError });
          throw new Error("Failed to upload new screenshot.");
        }

        const { data: publicUrlData } = supabase.storage.from("screenshots").getPublicUrl(fileName);

        return publicUrlData.publicUrl;
      });

      try {
        const urls = await Promise.all(uploadPromises);
        new_uploaded_urls = urls.filter((url): url is string => url !== null);
      } catch {
        return {
          success: false,
          error: "Gagal meng-upload gambar baru. Silakan coba lagi.",
        };
      }
    }

    const final_image_urls = [...retained_urls, ...new_uploaded_urls];
    const screenshot_url = final_image_urls.length > 0 ? final_image_urls[0] : "";

    const updatePayload: {
      game_id: string;
      title_reference: string;
      account_specs: string;
      capital_price: number;
      asking_price: number;
      image_urls: string[];
      screenshot_url: string;
      updated_at: string;
      status?: "UNPOSTED" | "AVAILABLE" | "SOLD";
    } = {
      game_id,
      title_reference,
      account_specs,
      capital_price,
      asking_price,
      image_urls: final_image_urls,
      screenshot_url,
      updated_at: new Date().toISOString(),
      ...(status ? { status } : {}),
    };

    const { error } = await supabase.from("inventory").update(updatePayload).eq("id", id);

    if (error) {
      logger.error("Database Error updating inventory", { error });
      return { success: false, error: "Gagal memperbarui stok di database." };
    }

    revalidatePath("/dashboard/inventory");
    purgeStorefront(STOREFRONT_TAGS.marketplace);
    return { success: true };
  });
}

export async function deleteInventoryItem(id: string) {
  return runAction("deleteInventoryItem", async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if item status is SOLD
    const { data: item, error: fetchError } = await supabase
      .from("inventory")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { success: false, error: "Stok tidak ditemukan." };
    }

    if (item?.status === "SOLD") {
      return { success: false, error: "Stok yang sudah TERJUAL (SOLD) tidak dapat dihapus." };
    }

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      logger.error("Database Error deleting inventory", { error });
      return { success: false, error: "Gagal menghapus stok dari database." };
    }

    revalidatePath("/dashboard/inventory");
    purgeStorefront(STOREFRONT_TAGS.marketplace);
    return { success: true };
  });
}
