"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { InventoryFormSchema } from "@/lib/schemas";

export async function getInventory() {
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
    console.error("Error fetching inventory:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getGames() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("games").select("id, name, slug").order("name");

  if (error) {
    console.error("Error fetching games:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function addInventoryItem(formData: FormData) {
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
          console.error("Supabase Storage Error:", uploadError);
          throw new Error("Failed to upload screenshot.");
        }

        const { data: publicUrlData } = supabase.storage.from("screenshots").getPublicUrl(fileName);

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

  const { error } = await supabase.from("inventory").insert({
    game_id: parsed.data.game_id,
    title_reference: parsed.data.title_reference,
    account_specs: parsed.data.account_specs,
    capital_price: parsed.data.capital_price,
    asking_price: parsed.data.asking_price,
    screenshot_url: screenshot_url,
    image_urls: image_urls,
    status: "UNPOSTED",
    added_by: user.id,
  });

  if (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to insert into database." };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function updateItemStatus(id: string, newStatus: "UNPOSTED" | "AVAILABLE" | "SOLD") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Failed to update item status." };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function markItemAsSold(id: string, soldPrice: number) {
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
    console.error("Error marking as sold:", error);
    return { success: false, error: "Failed to mark item as sold." };
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateInventoryItem(id: string, formData: FormData) {
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

  if (!game_id || !title_reference || isNaN(capital_price) || isNaN(asking_price)) {
    return { success: false, error: "Data form tidak lengkap atau tidak valid." };
  }

  const { error } = await supabase
    .from("inventory")
    .update({
      game_id,
      title_reference,
      account_specs,
      capital_price,
      asking_price,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Database Error updating inventory:", error);
    return { success: false, error: "Gagal memperbarui stok di database." };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function deleteInventoryItem(id: string) {
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
    console.error("Database Error deleting inventory:", error);
    return { success: false, error: "Gagal menghapus stok dari database." };
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}



