import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("MISSING NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local before running the seed.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "MISSING SUPABASE_SERVICE_ROLE_KEY. The seed requires the service-role key because it " +
      "re-seeds data (RLS bypass) and calls the process_payment RPC, which is only granted to " +
      "authenticated/service_role. Do NOT fall back to the anon key.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// FK-safe cleanup order (children before parents). deal_items.stock_id is ON
// DELETE RESTRICT, so stocks can only be removed after deal_items/trade_in_items/
// problem_cases/stock_histories are gone. users/public_users are intentionally
// left untouched (audit_logs and auth.users reference them).
const CLEANUP_TABLES = [
  "audit_logs",
  "finance_ledger",
  "payments",
  "deal_items",
  "trade_in_items",
  "problem_cases",
  "stock_histories",
  "deals",
  "stocks",
  "inventory",
  "accounts",
  "games",
  "worker_heartbeat",
] as const;

async function deleteAll(table: string) {
  const { error } = await supabase
    .from(table)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`Cleanup failed on ${table}: ${error.message}`);
}

async function insertRows<T extends Record<string, unknown>>(table: string, rows: T[]) {
  const { data, error } = await supabase
    .from(table)
    .insert(rows as never)
    .select();
  if (error) throw new Error(`Seed failed on ${table}: ${error.message}`);
  return data;
}

async function main() {
  try {
    // 1. CLEANUP
    console.log("Cleaning up existing data...");
    for (const table of CLEANUP_TABLES) {
      await deleteAll(table);
    }

    // 2. SEED GAMES
    console.log("Seeding Games...");
    const gameCategories = [
      { name: "Mobile Legends", slug: "mobile-legends" },
      { name: "Free Fire", slug: "free-fire" },
      { name: "Roblox", slug: "roblox" },
      { name: "PUBG Mobile", slug: "pubg-mobile" },
      { name: "Genshin Impact", slug: "genshin-impact" },
      { name: "Valorant", slug: "valorant" },
      { name: "Lainnya", slug: "lainnya" },
    ];
    await insertRows("games", gameCategories);

    const { data: allGames } = await supabase.from("games").select("id, name").order("name");
    const gameMap: Record<string, string> = {};
    for (const g of allGames ?? []) {
      gameMap[g.name] = g.id;
    }

    // 3. SEED INVENTORY
    console.log("Seeding Inventory...");
    const inventoryRows = [
      {
        game_id: gameMap["Mobile Legends"],
        title_reference: "MLBB Mythic Glory 120 Skins",
        account_specs: "Login Moonton/VK. Winrate 65%.",
        capital_price: 800000,
        asking_price: 1500000,
        status: "AVAILABLE",
        added_by: null,
      },
      {
        game_id: gameMap["Valorant"],
        title_reference: "Valorant Ascendant 3 - Kuronami Bundle",
        account_specs: "Riot Games Login. Asia Pacific.",
        capital_price: 1200000,
        asking_price: 2000000,
        status: "AVAILABLE",
        added_by: null,
      },
      {
        game_id: gameMap["Genshin Impact"],
        title_reference: "Genshin AR 60 - 20 C6 5-Stars",
        account_specs: "Hoyoverse Login. Asia Server. All map 100%.",
        capital_price: 2500000,
        asking_price: 4000000,
        status: "AVAILABLE",
        added_by: null,
      },
      {
        game_id: gameMap["PUBG Mobile"],
        title_reference: "PUBG Conqueror S19 - Glacier M416 Max",
        account_specs: "Twitter Login. Global version.",
        capital_price: 1500000,
        asking_price: 2500000,
        status: "AVAILABLE",
        added_by: null,
      },
      {
        game_id: gameMap["Free Fire"],
        title_reference: "FF Sultan Old Account - Elite Pass S1-S5",
        account_specs: "VK Login. Indo Server.",
        capital_price: 600000,
        asking_price: 1000000,
        status: "AVAILABLE",
        added_by: null,
      },
    ];
    await insertRows("inventory", inventoryRows);

    // 4. SEED ACCOUNTS
    console.log("Seeding Accounts...");
    const accounts = await insertRows("accounts", [
      { name: "QRIS Ferryshop", account_number: "QRIS-001", balance: 15000000 },
      { name: "Seabank", account_number: "9012345678", balance: 5000000 },
      { name: "Bank Jago", account_number: "1029384756", balance: 2500000 },
      { name: "DANA", account_number: "081234567891", balance: 1000000 },
      { name: "OVO", account_number: "081234567892", balance: 1500000 },
      { name: "GoPay", account_number: "081234567893", balance: 2000000 },
      { name: "Mandiri", account_number: "142001234567", balance: 10000000 },
    ]);

    const qrisAccount = accounts.find((a) => a.name === "QRIS Ferryshop");
    const seabankAccount = accounts.find((a) => a.name === "Seabank");
    if (!qrisAccount || !seabankAccount) {
      throw new Error("Seeded accounts not found after insert");
    }

    for (const acc of accounts) {
      await insertRows("finance_ledger", [
        {
          account_id: acc.id,
          transaction_type: "ADJUSTMENT",
          amount: acc.balance,
          description: `Initial balance for ${acc.name}`,
        },
      ]);
    }

    // 5. SEED STOCKS
    console.log("Seeding Stocks...");
    const stocks = await insertRows("stocks", [
      {
        category: "Mobile Legends",
        name: "MLBB Mythic Glory 120 Skins (Zodiac+Legend)",
        username: "admin_mlbb",
        password: "mlbbpassword",
        account_details: "Login Moonton/VK. Winrate 65%.",
        capital_price: 800000,
        post_price: 1500000,
        current_price: 1500000,
        status: "AVAILABLE",
        purchase_payment_status: "LUNAS",
        images: [
          "https://picsum.photos/seed/ml1/800/600",
          "https://picsum.photos/seed/ml2/800/600",
          "https://picsum.photos/seed/ml3/800/600",
          "https://picsum.photos/seed/ml4/800/600",
          "https://picsum.photos/seed/ml5/800/600",
        ],
      },
      {
        category: "Valorant",
        name: "Valorant Ascendant 3 - Kuronami Bundle",
        username: "valo_admin",
        password: "valopassword",
        account_details: "Riot Games Login. Asia Pacific.",
        capital_price: 1200000,
        post_price: 2000000,
        current_price: 2000000,
        status: "AVAILABLE",
        purchase_payment_status: "LUNAS",
        images: [
          "https://picsum.photos/seed/val1/800/600",
          "https://picsum.photos/seed/val2/800/600",
          "https://picsum.photos/seed/val3/800/600",
        ],
      },
      {
        category: "Genshin Impact",
        name: "Genshin AR 60 - 20 C6 5-Stars",
        username: "genshin_admin",
        password: "genshinpassword",
        account_details: "Hoyoverse Login. Asia Server. All map 100%.",
        capital_price: 2500000,
        post_price: 4000000,
        current_price: 4000000,
        status: "AVAILABLE",
        purchase_payment_status: "LUNAS",
        images: [
          "https://picsum.photos/seed/gi1/800/600",
          "https://picsum.photos/seed/gi2/800/600",
          "https://picsum.photos/seed/gi3/800/600",
          "https://picsum.photos/seed/gi4/800/600",
        ],
      },
      {
        category: "PUBG Mobile",
        name: "PUBG Conqueror S19 - Glacier M416 Max",
        username: "pubg_admin",
        password: "pubgpassword",
        account_details: "Twitter Login. Global version.",
        capital_price: 1500000,
        post_price: 2500000,
        current_price: 2500000,
        status: "AVAILABLE",
        purchase_payment_status: "LUNAS",
        images: [
          "https://picsum.photos/seed/pubg1/800/600",
          "https://picsum.photos/seed/pubg2/800/600",
        ],
      },
      {
        category: "Free Fire",
        name: "FF Sultan Old Account - Elite Pass S1-S5",
        username: "ff_admin",
        password: "ffpassword",
        account_details: "VK Login. Indo Server.",
        capital_price: 600000,
        post_price: 1000000,
        current_price: 1000000,
        status: "AVAILABLE",
        purchase_payment_status: "LUNAS",
        images: [
          "https://picsum.photos/seed/ff1/800/600",
          "https://picsum.photos/seed/ff2/800/600",
          "https://picsum.photos/seed/ff3/800/600",
        ],
      },
    ]);

    const mlbbStock = stocks.find((s) => s.category === "Mobile Legends");
    const valoStock = stocks.find((s) => s.category === "Valorant");
    const genshinStock = stocks.find((s) => s.category === "Genshin Impact");
    if (!mlbbStock || !valoStock || !genshinStock) {
      throw new Error("Seeded stocks not found after insert");
    }

    // 6. SEED TRANSACTIONS
    console.log("Seeding Transactions...");

    // Deal 1: Lunas (MLBB)
    const { data: deal1, error: deal1Err } = await supabase
      .from("deals")
      .insert({
        deal_number: `DEAL-${Date.now()}-1`,
        stock_id: mlbbStock.id,
        customer_name: "Budi Santoso",
        customer_contact: "081234567890",
        deal_type: "Penjualan",
        deal_price: 1500000,
        total_deal_price: 1500000,
        remaining_balance: 0,
        status: "COMPLETED",
      })
      .select()
      .single();
    if (deal1Err || !deal1) throw new Error(`Deal 1 insert failed: ${deal1Err?.message}`);

    await insertRows("deal_items", [
      {
        deal_id: deal1.id,
        stock_id: mlbbStock.id,
        price: 1500000,
      },
    ]);

    const { error: payment1Err } = await supabase.rpc("process_payment", {
      p_deal_id: deal1.id,
      p_account_id: qrisAccount.id,
      p_amount: 1500000,
      p_notes: "Lunas via QRIS",
      p_admin_id: null,
    });
    if (payment1Err) throw new Error(`Payment 1 failed: ${payment1Err.message}`);

    // Deal 2: Lunas (Valorant)
    const { data: deal2, error: deal2Err } = await supabase
      .from("deals")
      .insert({
        deal_number: `DEAL-${Date.now()}-2`,
        stock_id: valoStock.id,
        customer_name: "Jessica Wong",
        customer_contact: "089876543210",
        deal_type: "Penjualan",
        deal_price: 2000000,
        total_deal_price: 2000000,
        remaining_balance: 0,
        status: "PAID",
      })
      .select()
      .single();
    if (deal2Err || !deal2) throw new Error(`Deal 2 insert failed: ${deal2Err?.message}`);

    await insertRows("deal_items", [
      {
        deal_id: deal2.id,
        stock_id: valoStock.id,
        price: 2000000,
      },
    ]);

    const { error: payment2Err } = await supabase.rpc("process_payment", {
      p_deal_id: deal2.id,
      p_account_id: seabankAccount.id,
      p_amount: 2000000,
      p_notes: "Transfer Seabank Lunas",
      p_admin_id: null,
    });
    if (payment2Err) throw new Error(`Payment 2 failed: ${payment2Err.message}`);

    // Deal 3: Tukar Tambah (Genshin Impact)
    const { data: deal3, error: deal3Err } = await supabase
      .from("deals")
      .insert({
        deal_number: `DEAL-${Date.now()}-3`,
        stock_id: genshinStock.id,
        customer_name: "Anton Wijaya",
        customer_contact: "anton@email.com",
        deal_type: "Tukar Tambah",
        deal_price: 4000000,
        total_deal_price: 4000000,
        remaining_balance: 0,
        status: "COMPLETED",
      })
      .select()
      .single();
    if (deal3Err || !deal3) throw new Error(`Deal 3 insert failed: ${deal3Err?.message}`);

    await insertRows("deal_items", [
      {
        deal_id: deal3.id,
        stock_id: genshinStock.id,
        price: 4000000,
      },
    ]);

    const { error: payment3Err } = await supabase.rpc("process_payment", {
      p_deal_id: deal3.id,
      p_account_id: qrisAccount.id,
      p_amount: 4000000,
      p_notes: "Lunas via QRIS",
      p_admin_id: null,
    });
    if (payment3Err) throw new Error(`Payment 3 failed: ${payment3Err.message}`);

    // Operational Expenses in Ledger
    console.log("Seeding Ledger Expenses...");
    await insertRows("finance_ledger", [
      {
        account_id: seabankAccount.id,
        transaction_type: "PAYMENT_OUT",
        amount: -150000,
        notes: "Biaya Iklan Meta Ads & FB Marketing",
      },
      {
        account_id: seabankAccount.id,
        transaction_type: "PAYMENT_OUT",
        amount: -350000,
        notes: "Sewa Hosting Server & Domain Railway",
      },
      {
        account_id: qrisAccount.id,
        transaction_type: "REFUND",
        amount: -200000,
        notes: "Kompensasi Garansi Pelanggan MLBB",
      },
    ]);

    // 7. SEED PROBLEM CASES
    console.log("Seeding Problem Cases...");
    await insertRows("problem_cases", [
      {
        case_number: `CASE-${new Date().toISOString().slice(2, 7).replace("-", "")}-001`,
        issue_type: "Akun Tidak Bisa Login",
        chronology:
          "Buyer melaporkan akun MLBB tidak bisa login setelah transfer. Moonton kemungkinan ganti password.",
        stock_id: mlbbStock.id,
        deal_id: deal1.id,
        status: "OPEN",
      },
      {
        case_number: `CASE-${new Date().toISOString().slice(2, 7).replace("-", "")}-002`,
        issue_type: "Buyer Klaim Akun Berbeda",
        chronology:
          "Buyer mengklaim akun Valorant yang diterima berbeda dari listing. Sedang diverifikasi.",
        stock_id: valoStock.id,
        deal_id: deal2.id,
        status: "IN_PROGRESS",
      },
    ]);

    console.log("Database successfully seeded with realistic data!");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  }
}

main();
