"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/error";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { purgeStorefront, STOREFRONT_TAGS } from "@/lib/store-revalidate";
import { Game, PurchasePaymentStatus, PurchaseWithRelations } from "@/types/database";

async function uploadScreenshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  files: File[],
): Promise<string[]> {
  const uploadPromises = files.map(async (file, index) => {
    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const fileBody = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, fileBody, { contentType: file.type, upsert: true });

      if (uploadError) {
        logger.error("Supabase Storage Error", { error: uploadError });
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from("screenshots").getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    }
    return null;
  });

  const urls = await Promise.all(uploadPromises);
  return urls.filter((url): url is string => Boolean(url));
}

export async function purchaseStock(
  input:
    | FormData
    | {
        category: string;
        name: string;
        account_details: string;
        username?: string;
        password?: string;
        capital_price: number;
        post_price: number;
        current_price: number;
        seller_info?: string;
        internal_notes?: string;
        purchase_payment_status: PurchasePaymentStatus;
        payment_account_id?: string | null;
        images?: string[];
      },
): Promise<{ success: boolean; stockId?: string; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    let category = "";
    let name = "";
    let account_details = "";
    let username = "";
    let password = "";
    let capital_price = 0;
    let post_price = 0;
    let current_price = 0;
    let seller_info = "";
    let internal_notes = "";
    let purchase_payment_status: PurchasePaymentStatus = "LUNAS";
    let payment_account_id: string | null = null;
    let existingImages: string[] = [];
    let imageFiles: File[] = [];

    if (input instanceof FormData) {
      category = (input.get("category") as string) || "";
      name = (input.get("name") as string) || "";
      account_details = (input.get("account_details") as string) || "";
      username = (input.get("username") as string) || "";
      password = (input.get("password") as string) || "";
      capital_price = Number(input.get("capital_price")) || 0;
      post_price = Number(input.get("post_price")) || 0;
      current_price = Number(input.get("current_price")) || post_price;
      seller_info = (input.get("seller_info") as string) || "";
      internal_notes = (input.get("internal_notes") as string) || "";
      purchase_payment_status =
        (input.get("purchase_payment_status") as PurchasePaymentStatus) || "LUNAS";
      payment_account_id = (input.get("payment_account_id") as string) || null;
      imageFiles = input.getAll("images") as File[];
    } else {
      category = input.category;
      name = input.name;
      account_details = input.account_details || "";
      username = input.username || "";
      password = input.password || "";
      capital_price = Number(input.capital_price) || 0;
      post_price = Number(input.post_price) || 0;
      current_price = Number(input.current_price) || post_price;
      seller_info = input.seller_info || "";
      internal_notes = input.internal_notes || "";
      purchase_payment_status = input.purchase_payment_status;
      payment_account_id = input.payment_account_id || null;
      existingImages = input.images || [];
    }

    if (purchase_payment_status === "LUNAS" && !payment_account_id) {
      return { success: false, error: "Target Account must be selected for LUNAS payments" };
    }

    const { data: stockId, error } = await supabase.rpc("process_stock_purchase", {
      p_category: category,
      p_name: name,
      p_account_details: (account_details || null) as unknown as string,
      p_username: (username || null) as unknown as string,
      p_password: (password || null) as unknown as string,
      p_capital_price: capital_price,
      p_post_price: post_price,
      p_current_price: current_price,
      p_seller_info: (seller_info || null) as unknown as string,
      p_internal_notes: (internal_notes || null) as unknown as string,
      p_purchase_payment_status: purchase_payment_status,
      p_payment_account_id: (payment_account_id || null) as unknown as string,
      p_admin_id: adminId,
    });

    if (error) throw error;

    // Handle Uploading Screenshots
    let finalImageUrls = [...existingImages];
    if (imageFiles.length > 0) {
      const uploadedUrls = await uploadScreenshots(supabase, imageFiles);
      finalImageUrls = [...finalImageUrls, ...uploadedUrls];
    }

    if (stockId) {
      const screenshot_url = finalImageUrls.length > 0 ? finalImageUrls[0] : null;
      await Promise.all([
        (supabase.from("stocks").update as any)({ images: finalImageUrls }).eq("id", stockId),
        supabase
          .from("inventory")
          .update({
            screenshot_url: screenshot_url,
            image_urls: finalImageUrls,
          })
          .eq("id", stockId),
      ]);
    }

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/stock");
    purgeStorefront(STOREFRONT_TAGS.marketplace);

    return { success: true, stockId: stockId as string, error: null };
  } catch (error: unknown) {
    logger.error("Error purchasing stock", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getPurchases(): Promise<{
  data: PurchaseWithRelations[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: stocksData, error } = await supabase
      .from("stocks")
      .select(
        `
        id,
        sku,
        name,
        category,
        account_details,
        username,
        password,
        capital_price,
        post_price,
        current_price,
        status,
        seller_info,
        internal_notes,
        purchase_payment_status,
        purchase_date,
        created_at,
        images,
        accounts (name)
      `,
      )
      .order("purchase_date", { ascending: false });

    if (error) throw error;

    // Fetch corresponding inventory images to ensure full synchronization
    const stockIds = (stocksData || []).map((s) => s.id);
    const inventoryMap = new Map<string, { screenshot_url: string | null; image_urls: string[] }>();

    if (stockIds.length > 0) {
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("id, screenshot_url, image_urls")
        .in("id", stockIds);

      if (inventoryData) {
        inventoryData.forEach((inv) => {
          inventoryMap.set(inv.id, {
            screenshot_url: inv.screenshot_url,
            image_urls: inv.image_urls || [],
          });
        });
      }
    }

    const merged = (stocksData || []).map((stock) => {
      const inv = inventoryMap.get(stock.id);
      const stockImages = Array.isArray(stock.images)
        ? (stock.images as string[]).filter(Boolean)
        : [];
      const invImages = Array.isArray(inv?.image_urls) ? inv.image_urls.filter(Boolean) : [];
      const allImages = stockImages.length > 0 ? stockImages : invImages;
      const screenshot_url = allImages.length > 0 ? allImages[0] : inv?.screenshot_url || null;

      return {
        ...stock,
        images: allImages,
        image_urls: allImages,
        screenshot_url: screenshot_url,
      } as PurchaseWithRelations;
    });

    return { data: merged, error: null };
  } catch (error: unknown) {
    logger.error("Error fetching purchases", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}

export async function getGames(): Promise<{
  data: Game[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("games").select("id, name").order("name");

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error: unknown) {
    logger.error("Error fetching games", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}

export async function deletePurchase(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    const { error: stockError } = await supabase.from("stocks").delete().eq("id", id);
    if (stockError) throw stockError;

    // Also delete corresponding entry in inventory
    await supabase.from("inventory").delete().eq("id", id);

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/stock");
    purgeStorefront(STOREFRONT_TAGS.marketplace);

    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error("Error deleting purchase stock", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updatePurchase(
  id: string,
  data: {
    name?: string;
    category?: string;
    account_details?: string;
    username?: string;
    password?: string;
    capital_price?: number;
    post_price?: number;
    status?: string;
    seller_info?: string;
    internal_notes?: string;
    images?: string[];
  },
  newImageFiles?: File[],
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    let finalImages = data.images || [];
    if (newImageFiles && newImageFiles.length > 0) {
      const uploaded = await uploadScreenshots(supabase, newImageFiles);
      finalImages = [...finalImages, ...uploaded];
    }

    const stockUpdates: Record<string, unknown> = {};
    if (data.name !== undefined) stockUpdates.name = data.name;
    if (data.category !== undefined) stockUpdates.category = data.category;
    if (data.account_details !== undefined) stockUpdates.account_details = data.account_details;
    if (data.username !== undefined) stockUpdates.username = data.username;
    if (data.password !== undefined) stockUpdates.password = data.password;
    if (data.capital_price !== undefined) stockUpdates.capital_price = data.capital_price;
    if (data.post_price !== undefined) {
      stockUpdates.post_price = data.post_price;
      stockUpdates.current_price = data.post_price;
    }
    if (data.status !== undefined) stockUpdates.status = data.status;
    if (data.seller_info !== undefined) stockUpdates.seller_info = data.seller_info;
    if (data.internal_notes !== undefined) stockUpdates.internal_notes = data.internal_notes;
    if (data.images !== undefined || (newImageFiles && newImageFiles.length > 0)) {
      stockUpdates.images = finalImages;
    }

    const { error } = await (supabase.from("stocks").update as any)(stockUpdates).eq("id", id);

    if (error) throw error;

    // Synchronize update in inventory table
    const inventoryUpdates: {
      game_id?: string;
      title_reference?: string;
      account_specs?: string;
      capital_price?: number;
      asking_price?: number;
      status?: any;
      screenshot_url?: string | null;
      image_urls?: string[];
    } = {};
    if (data.name) inventoryUpdates.title_reference = data.name;
    if (data.account_details !== undefined) inventoryUpdates.account_specs = data.account_details;
    if (data.capital_price !== undefined) inventoryUpdates.capital_price = data.capital_price;
    if (data.post_price !== undefined) inventoryUpdates.asking_price = data.post_price;
    if (data.status !== undefined) inventoryUpdates.status = data.status;
    if (data.images !== undefined || (newImageFiles && newImageFiles.length > 0)) {
      inventoryUpdates.image_urls = finalImages;
      inventoryUpdates.screenshot_url = finalImages.length > 0 ? finalImages[0] : null;
    }

    if (data.category) {
      const { data: matchedGame } = await supabase
        .from("games")
        .select("id")
        .ilike("name", data.category)
        .limit(1)
        .maybeSingle();
      if (matchedGame?.id) {
        inventoryUpdates.game_id = matchedGame.id;
      }
    }

    if (Object.keys(inventoryUpdates).length > 0) {
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (existingInv) {
        await supabase.from("inventory").update(inventoryUpdates).eq("id", id);
      } else {
        const { data: stockRow } = await supabase
          .from("stocks")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (stockRow) {
          let resolvedGameId = inventoryUpdates.game_id;
          if (!resolvedGameId) {
            const { data: defaultGame } = await supabase
              .from("games")
              .select("id")
              .limit(1)
              .single();
            resolvedGameId = defaultGame?.id;
          }

          if (resolvedGameId) {
            await (supabase.from("inventory").insert as any)({
              id: id,
              game_id: resolvedGameId,
              title_reference: data.name || stockRow.name,
              account_specs: data.account_details || stockRow.account_details || stockRow.name,
              capital_price: data.capital_price ?? stockRow.capital_price,
              asking_price: data.post_price ?? stockRow.post_price ?? stockRow.current_price,
              status: (data.status || stockRow.status || "AVAILABLE") as any,
              screenshot_url: finalImages.length > 0 ? finalImages[0] : null,
              image_urls: finalImages,
              public_id: stockRow.sku || `STK-${id.slice(0, 8).toUpperCase()}`,
            });
          }
        }
      }
    }

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/stock");
    purgeStorefront(STOREFRONT_TAGS.marketplace);

    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error("Error updating purchase stock", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function settlePurchasePayment(
  stockId: string,
  paymentAccountId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      return { success: false, error: "Sesi admin tidak ditemukan. Silakan login kembali." };
    }

    if (!paymentAccountId) {
      return { success: false, error: "Pilih rekening pembayaran untuk pelunasan." };
    }

    const { error } = await supabase.rpc("settle_stock_purchase", {
      p_stock_id: stockId,
      p_account_id: paymentAccountId,
      p_admin_id: adminId,
    });

    if (error) throw error;

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/stock");
    revalidatePath("/dashboard/ledger");
    revalidatePath("/dashboard/accounts");
    purgeStorefront(STOREFRONT_TAGS.marketplace);

    return { success: true, error: null };
  } catch (error: unknown) {
    logger.error("Error settling purchase payment", { error });
    return { success: false, error: getErrorMessage(error) };
  }
}
