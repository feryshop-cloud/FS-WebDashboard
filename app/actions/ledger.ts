"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLedgers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_ledger")
    .select(
      `
      *,
      accounts (
        name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ledgers:", error);
    throw new Error("Gagal memuat riwayat transaksi kas.");
  }

  return data;
}
