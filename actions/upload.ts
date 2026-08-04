"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

/**
 * Uploads a file to the 'images' Supabase storage bucket and returns its public URL.
 * Assumes the 'images' bucket exists and has appropriate policies.
 */
export async function uploadImage(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  return runAction("uploadImage", async () => {
    try {
      const file = formData.get("file") as File | null;
      if (!file) {
        return { success: false, error: "No file provided" };
      }

      const supabase = await createClient();

      // Ensure user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Unauthorized" };
      }

      // Generate a unique file name
      const ext = file.name.split(".").pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      // Upload the file
      const { data, error } = await supabase.storage.from("images").upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        logger.error("Supabase upload error", { error });
        return { success: false, error: `Upload failed: ${error.message}` };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(data.path);

      return { success: true, url: publicUrl };
    } catch (err) {
      logger.error("Upload exception", { error: err });
      return {
        success: false,
        error: (err as { message?: string }).message || "Internal server error during upload",
      };
    }
  });
}