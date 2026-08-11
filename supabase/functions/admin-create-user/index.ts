import { createClient } from "jsr:@supabase/supabase-js@2";

const ADMIN_ROLES = ["OWNER", "ADMIN"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generatePassword(length = 12): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const all = lower + upper + digits;

  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);

  const chars = Array.from(buf, (b) => all[b % all.length]);
  chars[0] = lower[buf[0] % lower.length];
  chars[1] = upper[buf[1] % upper.length];
  chars[2] = digits[buf[2] % digits.length];

  for (let i = length - 1; i > 0; i--) {
    const j = buf[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const anon = createClient(url, anonKey);

  const {
    data: { user },
    error: userErr,
  } = await anon.auth.getUser(token);

  if (userErr || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: caller, error: callerErr } = await admin
    .from("users")
    .select("roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (callerErr || !caller?.roles || !ADMIN_ROLES.includes(caller.roles.name)) {
    return json({ error: "Forbidden" }, 403);
  }

  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    role_id?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim() ?? "";
  const full_name = body.full_name?.trim();
  const role_id = body.role_id?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email tidak valid" }, 400);
  }
  if (!full_name) {
    return json({ error: "Nama lengkap wajib diisi" }, 400);
  }
  if (password && password.length < 6) {
    return json({ error: "Password minimal 6 karakter" }, 400);
  }

  const generatedPassword = password ? undefined : generatePassword();
  const finalPassword = password || (generatedPassword as string);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: finalPassword,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createErr || !created.user) {
    return json({ error: createErr?.message ?? "Gagal membuat pengguna" }, 400);
  }

  if (role_id) {
    const { error: roleErr } = await admin
      .from("users")
      .update({ role_id, updated_at: new Date().toISOString() })
      .eq("id", created.user.id);

    if (roleErr) {
      return json({ error: `User dibuat tapi gagal set role: ${roleErr.message}` }, 500);
    }
  }

  return json({
    success: true,
    id: created.user.id,
    email: created.user.email ?? email,
    ...(generatedPassword ? { generated_password: generatedPassword } : {}),
  });
});
