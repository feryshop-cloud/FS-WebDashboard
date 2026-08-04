import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export async function getCurrentRole(): Promise<AppRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("users")
    .select("roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  const role = data?.roles?.name ?? null;

  if (role === "OWNER" || role === "ADMIN" || role === "VIEWER" || role === "MEMBER") {
    return role;
  }

  return null;
}
