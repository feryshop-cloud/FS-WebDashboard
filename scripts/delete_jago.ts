import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: accounts } = await supabase.from("accounts").select("id").eq("name", "Bank Jago");
  if (!accounts || accounts.length === 0) return console.log("Bank Jago not found");
  const id = accounts[0].id;

  await supabase.from("finance_ledger").delete().eq("account_id", id);
  await supabase.from("payments").delete().eq("account_id", id);

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) console.error(error);
  else console.log("Deleted Bank Jago and all its ledgers");
}

main();
