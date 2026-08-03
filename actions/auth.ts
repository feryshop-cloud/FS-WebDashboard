"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema } from "@/lib/schemas";

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const parsed = LoginSchema.safeParse({ email, password });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: error.message || "Invalid email or password." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error logging in:", error);
    return {
      success: false,
      error: (error as { message?: string }).message || "An unexpected error occurred",
    };
  }
}
