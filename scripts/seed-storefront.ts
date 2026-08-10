import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Minimal seed data based on the fallback
const seedGames = [
  {
    id: 1,
    title: "Mobile Legends: Bang Bang",
    slug: "mobile-legends",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
    banner:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=100&auto=format&fit=crop",
    developers: "Moonton",
    categoryId: 1,
    description:
      "Top up Diamond Mobile Legends resmi 100% legal, murah, dan instan masuk ke akun Anda dalam hitungan detik.",
    isPopular: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    title: "Free Fire",
    slug: "free-fire",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400&auto=format&fit=crop",
    banner:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=100&auto=format&fit=crop",
    developers: "Garena",
    categoryId: 1,
    description: "Top up Diamond Free Fire Garena termurah dan tercepat langsung proses 24 jam.",
    isPopular: true,
    isActive: true,
    sortOrder: 2,
  },
];

const seedProducts = {
  "mobile-legends": [
    {
      id: "ML-86",
      title: "86 Diamonds (78 + 8 Bonus)",
      selling_price: 23500,
      selling_price_gold: 23000,
      selling_price_platinum: 22500,
      promo_price: 22000,
      is_active: true,
    },
    {
      id: "ML-WDP",
      title: "Weekly Diamond Pass (WDP)",
      selling_price: 28500,
      selling_price_gold: 28000,
      selling_price_platinum: 27500,
      promo_price: 27000,
      is_active: true,
    },
  ],
  "free-fire": [
    {
      id: "FF-70",
      title: "70 Diamonds",
      selling_price: 10000,
      selling_price_gold: 9800,
      selling_price_platinum: 9500,
      promo_price: null,
      is_active: true,
    },
  ],
};

const seedPaymentMethods = [
  {
    id: "qris",
    name: "QRIS (All Bank & E-Wallet)",
    payment_id: "QRIS",
    minimum_amount: 1000,
    maximum_amount: 10000000,
    fee: 0,
    fee_percent: 0.7,
    type: "qris",
    status: "ACTIVE",
    group: "QRIS & E-Wallet",
  },
];

async function main() {
  console.log("Seeding storefront games...");
  for (const game of seedGames) {
    const { error } = await supabase.from("games").upsert(
      {
        name: game.title,
        slug: game.slug,
        image_url: game.image,
        banner: game.banner,
        logo: game.logo,
        developers: game.developers,
        description: game.description,
        is_popular: game.isPopular,
        is_active: game.isActive,
      },
      { onConflict: "slug" },
    );
    if (error) console.error("Error seeding game:", error);
  }

  console.log("Seeding storefront products...");
  for (const [slug, products] of Object.entries(seedProducts)) {
    for (const p of products) {
      const { error: delError } = await supabase
        .from("products")
        .delete()
        .eq("sku", p.id);
      if (delError) {
        console.error("Error removing old product:", delError);
        continue;
      }

      const { error } = await supabase.from("products").insert({
        sku: p.id,
        game_slug: slug,
        title: p.title,
        selling_price: p.selling_price,
        selling_price_gold: p.selling_price_gold,
        selling_price_platinum: p.selling_price_platinum,
        promo_price: p.promo_price,
        is_active: p.is_active,
        sort_order: 1,
      });
      if (error) console.error("Error seeding product:", error);
    }
  }

  console.log("Seeding payment methods...");
  for (const pm of seedPaymentMethods) {
    const { error } = await supabase.from("payment_methods").upsert(
      {
        id: pm.id,
        payment_id: pm.payment_id,
        name: pm.name,
        type: pm.type,
        status: pm.status,
        group: pm.group,
        fee: pm.fee,
        fee_percent: pm.fee_percent,
      },
      { onConflict: "id" },
    );
    if (error) console.error("Error seeding payment method:", error);
  }

  console.log("Done seeding storefront data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
