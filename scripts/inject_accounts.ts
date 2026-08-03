import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const accounts = [
    { name: "DANA", account_number: "081234567890", balance: 5000000, is_active: true },
    { name: "OVO", account_number: "081234567891", balance: 3500000, is_active: true },
    { name: "GOPAY", account_number: "081234567892", balance: 4200000, is_active: true },
    { name: "Bank Mandiri", account_number: "1300012345678", balance: 12500000, is_active: true },
  ];

  const { error } = await supabase.from("accounts").insert(accounts);

  if (error) {
    console.error("Error inserting accounts:", error);
  } else {
    console.log("Successfully inserted accounts!");
  }
}

seed();
