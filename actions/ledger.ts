"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/error";
import { logger } from "@/lib/logger";
import { LedgerWithRelations } from "@/types/database";

export async function getLedgerEntries(filters?: {
  accountId?: string;
  type?: "IN" | "OUT";
}): Promise<{ data: LedgerWithRelations[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("finance_ledger")
      .select(
        `
        *,
        account:accounts(id, name),
        deal:deals(id, deal_number),
        stock:stocks(id, name)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.accountId) {
      query = query.eq("account_id", filters.accountId);
    }

    if (filters?.type) {
      if (filters.type === "IN") {
        // Positive amounts are money IN
        query = query.gt("amount", 0);
      } else if (filters.type === "OUT") {
        // Negative amounts are money OUT
        query = query.lt("amount", 0);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: (data as unknown) as LedgerWithRelations[],
      error: null,
    };
  } catch (error: unknown) {
    logger.error("Error fetching ledger entries", { error });
    return { data: null, error: getErrorMessage(error) };
  }
}
