import { useState, useEffect, useTransition } from "react";
import { getProfitLossReport } from "@/app/actions/reports";

export interface ProfitLossBreakdownItem {
  label: string;
  amount: number;
}

export interface ProfitLossReportData {
  revenue?: number;
  cogs?: number;
  netProfit?: number;
  breakdown?: {
    income?: ProfitLossBreakdownItem[];
    expenses?: ProfitLossBreakdownItem[];
  };
  // Legacy fields (kept for backward compat)
  totalRevenue?: number;
  totalHPP?: number;
  grossProfit?: number;
  totalOperationalExpenses?: number;
  grossProfitMargin?: number;
  netProfitMargin?: number;
  revenueItems?: Array<{ name: string; amount: number }>;
  hppItems?: Array<{ name: string; amount: number }>;
  expenseItems?: Array<{ name: string; amount: number }>;
}

const getDateRange = (filter: string) => {
  const now = new Date();
  if (filter === "TODAY") {
    const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    return { startDate: start, endDate: end };
  }
  if (filter === "7_DAYS") {
    const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
    return { startDate: start, endDate: undefined };
  }
  if (filter === "THIS_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { startDate: start, endDate: undefined };
  }
  if (filter === "THIS_YEAR") {
    const start = new Date(now.getFullYear(), 0, 1).toISOString();
    return { startDate: start, endDate: undefined };
  }
  return { startDate: undefined, endDate: undefined };
};

export function useProfitLossReport() {
  const [reportData, setReportData] = useState<ProfitLossReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [, startTransition] = useTransition();

  const loadData = (filter: string) => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange(filter);
    getProfitLossReport(startDate, endDate)
      .then((data) => {
        setReportData(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    const { startDate, endDate } = getDateRange(periodFilter);
    getProfitLossReport(startDate, endDate)
      .then((data) => {
        if (!active) return;
        setReportData(data);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [periodFilter]);

  const grossProfit = reportData ? (reportData.revenue ?? 0) - (reportData.cogs ?? 0) : 0;
  const totalExpenses = reportData
    ? (reportData.breakdown?.expenses ?? [])
        .slice(1)
        .reduce((acc: number, curr: ProfitLossBreakdownItem) => acc + curr.amount, 0)
    : 0;

  return {
    data: {
      reportData,
      grossProfit,
      totalExpenses,
    },
    isLoading,
    uiState: {
      periodFilter,
    },
    actions: {
      setPeriodFilter,
      reload: () => startTransition(() => loadData(periodFilter)),
    },
  };
}
