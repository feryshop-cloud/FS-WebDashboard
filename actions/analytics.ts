"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/error";
import { logger } from "@/lib/logger";

export async function getTotalBalance(): Promise<{ data: number; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("accounts").select("balance").eq("is_active", true);

    if (error) throw error;

    const total = data.reduce((sum, account) => sum + (account.balance || 0), 0);
    return { data: total, error: null };
  } catch (error: unknown) {
    logger.error("Error fetching total balance", { error });
    return { data: 0, error: getErrorMessage(error) };
  }
}

export async function getInventoryStats(): Promise<{
  data: Record<string, number>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("stocks").select("status");

    if (error) throw error;

    const stats = {
      available: 0,
      sold: 0,
      booked: 0,
      other: 0,
      total: data.length,
    };

    data.forEach((stock) => {
      if (stock.status === "AVAILABLE") stats.available++;
      else if (stock.status === "SOLD") stats.sold++;
      else if (stock.status === "BOOKED") stats.booked++;
      else stats.other++;
    });

    return { data: stats, error: null };
  } catch (error: unknown) {
    logger.error("Error fetching inventory stats", { error });
    return { data: {}, error: getErrorMessage(error) };
  }
}

export async function getFinancialSummary(): Promise<{
  data: { omzet: number; profit: number; piutang: number };
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Fetch active/completed deals to calculate omzet and piutang
    const { data: deals, error } = await supabase
      .from("deals")
      .select(
        `
        total_deal_price,
        total_paid,
        status,
        deal_items (
          price,
          stocks (
            capital_price
          )
        )
      `,
      )
      .in("status", ["BOOKED", "LIMITED_ACCESS", "PAID", "COMPLETED"]);

    if (error) throw error;

    let omzet = 0;
    let capital = 0;
    let piutang = 0;

    deals.forEach((deal: Record<string, unknown>) => {
      omzet += Number(deal.total_deal_price || 0);
      piutang += Number(deal.total_deal_price || 0) - Number(deal.total_paid || 0);

      // Calculate capital only if there are related stock items
      if (deal.deal_items && Array.isArray(deal.deal_items)) {
        deal.deal_items.forEach((item: Record<string, unknown>) => {
          const stocks = item.stocks as { capital_price?: number | null } | null;
          if (stocks && stocks.capital_price) {
            capital += Number(stocks.capital_price || 0);
          }
        });
      }
    });

    return {
      data: {
        omzet,
        profit: omzet - capital,
        piutang,
      },
      error: null,
    };
  } catch (error: unknown) {
    logger.error("Error fetching financial summary", { error });
    return {
      data: { omzet: 0, profit: 0, piutang: 0 },
      error: getErrorMessage(error),
    };
  }
}

export async function getRecentLedger(
  limit = 5,
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("finance_ledger")
      .select(
        `
        *,
        accounts (name),
        users (full_name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: unknown) {
    logger.error("Error fetching recent ledger", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}

export async function getRevenueProfitTrend(days = 30): Promise<{
  data: Array<{ date: string; label: string; revenue: number; profit: number }>;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const { data: entries, error } = await supabase
      .from("finance_ledger")
      .select("amount, transaction_type, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const map = new Map<string, { revenue: number; expense: number }>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { revenue: 0, expense: 0 });
    }

    (entries || []).forEach((entry) => {
      const dateKey = new Date(entry.created_at).toISOString().slice(0, 10);
      const amt = Number(entry.amount || 0);
      const current = map.get(dateKey) || { revenue: 0, expense: 0 };

      if (amt > 0) {
        current.revenue += amt;
      } else if (amt < 0) {
        current.expense += Math.abs(amt);
      }
      map.set(dateKey, current);
    });

    const result = Array.from(map.entries()).map(([dateStr, val]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const profit = val.revenue - val.expense;
      return {
        date: dateStr,
        label,
        revenue: val.revenue,
        profit: profit,
      };
    });

    return { data: result, error: null };
  } catch (error: unknown) {
    logger.error("Error fetching revenue profit trend", { error });
    return { data: [], error: getErrorMessage(error) };
  }
}
