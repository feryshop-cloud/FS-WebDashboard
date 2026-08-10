const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log("Starting database seeding process with correct enums and UUIDs...");

    // 1. Get existing user ID
    let { data: users } = await supabase.from("users").select("id").limit(1);
    let userId = users?.[0]?.id || null;
    console.log(`Using user ID: ${userId}`);

    // 2. Get or create dummy customer
    let { data: customers } = await supabase.from("customers").select("id").limit(1);
    let customerId = customers?.[0]?.id || null;
    if (!customerId) {
      console.log("No customer found. Creating a dummy customer...");
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({
          name: "Joko Susilo",
          phone: "081234567890",
          email: "joko@gmail.com",
          notes: "Dummy Customer",
        })
        .select("id")
        .single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }
    console.log(`Using customer ID: ${customerId}`);

    // 3. Clear out previously seeded data to prevent duplicates
    console.log("Cleaning up previously seeded data...");
    await supabase.from("problem_cases").delete().like("case_number", "CASE-%");
    await supabase.from("trade_in_items").delete().like("description", "Akun ML Level %");
    await supabase.from("deal_items").delete().gt("price", 0);
    await supabase.from("deals").delete().like("notes", "Auto seeded %");
    await supabase.from("orders").delete().like("order_id", "INV-%");
    await supabase.from("products").delete().like("sku", "SKU-ML-%");
    await supabase.from("stocks").delete().eq("notes", "Generated automatically");
    await supabase.from("promo_codes").delete().like("code", "DISCOUNT%");

    const batchSize = 500;
    const totalRecords = 10000;
    const stockIds = [];
    const productIds = [];

    // --- SEED STOCKS (INVENTORY & PURCHASES) ---
    console.log("Seeding STOCKS...");
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i + j + 1;
        batch.push({
          sku: `STK-${idx}-${Date.now()}-${j}`,
          category: "Mobile Legends",
          name: `MLBB Account Tier Mythic ${idx}`,
          account_detail: `Login via Moonton ID. Email: user${idx}@gmail.com. Password: secret${idx}`,
          login_info: `user${idx}@gmail.com`,
          password_info: `secret${idx}`,
          backup_code: "123456, 789012",
          capital_price: 150000 + (idx % 100) * 1000,
          post_price: 250000 + (idx % 100) * 1000,
          current_price: 240000 + (idx % 100) * 1000,
          status: "AVAILABLE",
          purchase_payment_status: idx % 5 === 0 ? "PENDING" : "LUNAS",
          purchase_date: new Date().toISOString(),
          seller_info: "Feryshop Supplier Team",
          notes: "Generated automatically",
          managed_by: userId,
        });
      }
      const { data: inserted, error } = await supabase.from("stocks").insert(batch).select("id");
      if (error) throw error;
      if (inserted) {
        inserted.forEach((s) => stockIds.push(s.id));
      }
      console.log(`  Seeded stocks ${i + batch.length}/${totalRecords}`);
    }

    // --- SEED PRODUCTS (TOPUP PRODUCTS) ---
    console.log("Seeding PRODUCTS...");
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i + j + 1;
        batch.push({
          id: crypto.randomUUID(),
          game_slug: "mobile-legends",
          title: `${86 + idx} Diamonds (Fast/Promo)`,
          selling_price: 20000 + (idx % 50) * 500,
          selling_price_gold: 19500 + (idx % 50) * 500,
          selling_price_platinum: 19000 + (idx % 50) * 500,
          cost_price: 18000 + (idx % 50) * 500,
          sku: `SKU-ML-${idx}`,
          is_active: true,
          is_gangguan: false,
          sort_order: idx,
        });
      }
      const { data: insertedProducts, error } = await supabase
        .from("products")
        .insert(batch)
        .select("id");
      if (error) throw error;
      if (insertedProducts) {
        insertedProducts.forEach((p) => productIds.push(p.id));
      }
      console.log(`  Seeded products ${i + batch.length}/${totalRecords}`);
    }

    // --- SEED DEALS (DEALS & TRADE IN DEALS) ---
    console.log("Seeding DEALS...");
    const dealTypes = ["Penjualan", "Tukar Tambah"];
    for (const type of dealTypes) {
      console.log(`Seeding ${type} deals...`);
      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize; j++) {
          const idx = i + j + 1;
          batch.push({
            deal_number: `DL-${type === "Penjualan" ? "PJ" : "TT"}-${idx}-${Date.now()}-${j}`,
            customer_id: customerId,
            deal_type: type,
            total_deal_price: 300000 + (idx % 100) * 2000,
            total_paid: type === "Penjualan" ? 300000 + (idx % 100) * 2000 : 0,
            status: type === "Penjualan" ? "PAID" : "DRAFT",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Auto seeded ${type} deal #${idx}`,
            handled_by: userId,
          });
        }
        const { data: newDeals, error } = await supabase.from("deals").insert(batch).select("id");
        if (error) throw error;

        // Populate deal_items to link to a valid stock
        if (newDeals && stockIds.length > 0) {
          const dealItemsBatch = newDeals.map((deal, dIdx) => {
            const stockId = stockIds[(i + dIdx) % stockIds.length];
            return {
              deal_id: deal.id,
              stock_id: stockId,
              price: 300000 + (dIdx % 100) * 2000,
            };
          });
          const { error: diErr } = await supabase.from("deal_items").insert(dealItemsBatch);
          if (diErr) throw diErr;
        }

        // If Tukar Tambah, seed trade_in_items
        if (type === "Tukar Tambah" && newDeals) {
          const tradeInBatch = newDeals.map((deal, dIdx) => ({
            deal_id: deal.id,
            description: `Akun ML Level ${50 + dIdx}`,
            estimated_value: 150000 + (dIdx % 10) * 5000,
          }));
          const { error: tiErr } = await supabase.from("trade_in_items").insert(tradeInBatch);
          if (tiErr) throw tiErr;
        }

        console.log(`  Seeded ${type} deals ${i + batch.length}/${totalRecords}`);
      }
    }

    // --- SEED ORDERS (TOPUP ORDERS) ---
    console.log("Seeding ORDERS...");
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i + j + 1;
        const productId = productIds[(i + j) % productIds.length];
        batch.push({
          order_id: `INV-${idx}-${Date.now()}-${j}`,
          game_slug: "mobile-legends",
          product_id: productId,
          product_title: `Diamonds ${idx}`,
          id_games: `123456${idx}`,
          server_games: `${idx % 10 ? 2000 + (idx % 5) : 8000}`,
          nickname: `Player${idx}`,
          quantity: 1,
          price: 50000 + (idx % 100) * 1000,
          total_price: 50000 + (idx % 100) * 1000,
          payment_name: "QRIS",
          payment_code: "QRIS_GO_PAY",
          payment_status: "COMPLETED",
          buy_status: "SUCCESS",
          serial_number: `SN-ML-${idx}-99823`,
          whatsapp: "089876543210",
          email: `player${idx}@gmail.com`,
        });
      }
      const { error } = await supabase.from("orders").insert(batch);
      if (error) throw error;
      console.log(`  Seeded orders ${i + batch.length}/${totalRecords}`);
    }

    // --- SEED PROBLEM CASES ---
    console.log("Seeding PROBLEM CASES...");
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i + j + 1;
        batch.push({
          case_number: `CASE-${idx}-${Date.now()}-${j}`,
          issue_type: idx % 2 === 0 ? "Akun Kena Hackback" : "Topup Tidak Masuk",
          status: "OPEN", // Correct ENUM value ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_THIRD_PARTY', 'RESOLVED', 'CANNOT_RESOLVE', 'PERMANENT', 'REFUND', 'CANCEL')
          chronology: `Customer komplain akun dinonaktifkan pada transaksi #${idx}`,
          resolution: "",
          handled_by: userId,
        });
      }
      const { error } = await supabase.from("problem_cases").insert(batch);
      if (error) throw error;
      console.log(`  Seeded problem cases ${i + batch.length}/${totalRecords}`);
    }

    // --- SEED PROMO CODES ---
    console.log("Seeding PROMO CODES...");
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i + j + 1;
        batch.push({
          code: `DISCOUNT${idx}-${Date.now()}-${j}`,
          discount_type: idx % 2 === 0 ? "percent" : "fixed",
          discount_value: idx % 2 === 0 ? 10 : 5000,
          min_order: 10000,
          max_discount: idx % 2 === 0 ? 20000 : 5000,
          quota: 100,
          used_count: 0,
          is_active: true,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      const { error } = await supabase.from("promo_codes").insert(batch);
      if (error) throw error;
      console.log(`  Seeded promo codes ${i + batch.length}/${totalRecords}`);
    }

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error during data seeding:", error);
    process.exit(1);
  }
}

main();
