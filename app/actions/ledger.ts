"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/logging/server-action";

export async function getLedgers(page?: number, limit?: number, accountId?: string) {
  return runAction("getLedgers", async () => {
    const supabase = await createClient();

    let query = supabase
      .from("finance_ledger")
      .select(
        `
          *,
          accounts (
            name
          )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    if (page && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error("Error fetching ledgers", { error });
      throw new Error("Gagal memuat riwayat transaksi kas.");
    }

    return { data: data || [], totalCount: count || 0 };
  });
}
