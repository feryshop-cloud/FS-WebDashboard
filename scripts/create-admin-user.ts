import { createClient } from "@supabase/supabase-js";

type AppRole = "OWNER" | "ADMIN" | "VIEWER";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ferryshop.com";
const adminPassword = process.env.ADMIN_PASSWORD;
const adminFullName = process.env.ADMIN_FULL_NAME ?? "Ferryshop Admin";
const adminRole = (process.env.ADMIN_ROLE ?? "OWNER") as AppRole;

const allowedRoles: AppRole[] = ["OWNER", "ADMIN", "VIEWER"];

function assertConfig() {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required in .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in .env.local");
  }

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD is required in .env.local and must be at least 8 characters");
  }

  if (!allowedRoles.includes(adminRole)) {
    throw new Error(`ADMIN_ROLE must be one of: ${allowedRoles.join(", ")}`);
  }
}

async function findUserIdByEmail(email: string) {
  const perPage = 100;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return existingUser.id;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  return null;
}

assertConfig();

const resolvedSupabaseUrl = supabaseUrl;
const resolvedServiceRoleKey = serviceRoleKey;
const resolvedAdminPassword = adminPassword;

if (!resolvedSupabaseUrl || !resolvedServiceRoleKey || !resolvedAdminPassword) {
  throw new Error("Admin user environment validation failed");
}

const supabase = createClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function ensureRoleId(roleName: AppRole) {
  const { data: existingRole, error: existingRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .maybeSingle();

  if (existingRoleError) {
    throw existingRoleError;
  }

  if (existingRole) {
    return existingRole.id as string;
  }

  const { data: createdRole, error: createdRoleError } = await supabase
    .from("roles")
    .insert({
      name: roleName,
      permissions: {
        role: roleName,
      },
    })
    .select("id")
    .single();

  if (createdRoleError) {
    throw createdRoleError;
  }

  return createdRole.id as string;
}

async function ensureAuthUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: resolvedAdminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminFullName,
      role: adminRole,
    },
  });

  if (!error && data.user) {
    return data.user.id;
  }

  const existingUserId = await findUserIdByEmail(adminEmail);

  if (!existingUserId) {
    throw error ?? new Error(`Unable to create or find auth user for ${adminEmail}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUserId, {
    password: resolvedAdminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: adminFullName,
      role: adminRole,
    },
  });

  if (updateError) {
    throw updateError;
  }

  return existingUserId;
}

async function main() {
  console.log("Creating admin user...");

  const roleId = await ensureRoleId(adminRole);
  const userId = await ensureAuthUser();

  const { error: profileError } = await supabase.from("public_users").upsert(
    {
      id: userId,
      full_name: adminFullName,
      role_id: roleId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: userMirrorError } = await supabase.from("users").upsert(
    {
      id: userId,
      full_name: adminFullName,
      email: adminEmail,
      role_id: roleId,
      status: "ACTIVE",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (userMirrorError && userMirrorError.code !== "PGRST205") {
    throw userMirrorError;
  }

  console.log(`Admin user is ready: ${adminEmail}`);
  console.log(`Role: ${adminRole}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Admin user creation failed:", message);
  process.exit(1);
});
