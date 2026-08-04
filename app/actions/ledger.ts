"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getLedgers() {
  return runAction("getLedgers", async () => {
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
      logger.error("Error fetching ledgers", { error });
      throw new Error("Gagal memuat riwayat transaksi kas.");
    }

    return data;
  });
}
