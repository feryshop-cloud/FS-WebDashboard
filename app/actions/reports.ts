"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfitLossReport() {
  const supabase = await createClient();

  // 1. Get Income from deals
  const { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select(
      `
      deal_type,
      total_deal_price,
      deal_items ( stocks ( capital_price ) )
    `,
    )
    .in("status", ["BOOKED", "LIMITED_ACCESS", "PAID", "COMPLETED"]);

  if (dealsError) {
    console.error("Error fetching deals for P&L:", dealsError);
    return null;
  }

  let penjualanLunas = 0;
  let tukarTambah = 0;
  let totalHpp = 0;

  deals.forEach((deal: Record<string, unknown>) => {
    const price = Number(deal.total_deal_price || 0);
    if (deal.deal_type === "Penjualan") {
      penjualanLunas += price;
    } else {
      tukarTambah += price;
    }

    const dealItems = deal.deal_items as Array<{ stocks?: { capital_price?: number | null } | null }> | null;
    if (dealItems) {
      dealItems.forEach((item) => {
        const stocks = item.stocks;
        if (stocks && stocks.capital_price) {
          totalHpp += Number(stocks.capital_price || 0);
        }
      });
    }
  });

  // 2. Get Expenses from Ledger
  const { data: ledger, error: ledgerError } = await supabase
    .from("finance_ledger")
    .select("transaction_type, amount")
    .in("transaction_type", ["PAYMENT_OUT", "REFUND"]);

  if (ledgerError) {
    console.error("Error fetching ledger for P&L:", ledgerError);
    return null;
  }

  let biayaOperasional = 0;
  let biayaRefund = 0;

  ledger.forEach((tx: Record<string, unknown>) => {
    // Amounts in ledger for out are usually negative, we use Math.abs to sum them as expenses
    const amt = Math.abs(Number(tx.amount || 0));
    if (tx.transaction_type === "PAYMENT_OUT") {
      biayaOperasional += amt;
    } else if (tx.transaction_type === "REFUND") {
      biayaRefund += amt;
    }
  });

  const totalRevenue = penjualanLunas + tukarTambah;
  const totalExpensesExtra = biayaOperasional + biayaRefund;
  const netProfit = totalRevenue - totalHpp - totalExpensesExtra;

  return {
    revenue: totalRevenue,
    cogs: totalHpp,
    netProfit: netProfit,
    breakdown: {
      income: [
        { label: "Penjualan", amount: penjualanLunas },
        { label: "Tukar Tambah", amount: tukarTambah },
      ],
      expenses: [
        { label: "Modal Stok Terjual (HPP)", amount: totalHpp },
        { label: "Biaya Refund & Kompensasi", amount: biayaRefund },
        { label: "Biaya Operasional Lainnya", amount: biayaOperasional },
      ],
    },
  };
}
