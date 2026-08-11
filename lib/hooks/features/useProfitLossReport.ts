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

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface MonthOption {
  value: string;
  label: string;
}

export function getMonthOptions(count = 12): MonthOption[] {
  const now = new Date();
  const options: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return options;
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
  if (filter === "LAST_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (filter === "THIS_YEAR") {
    const start = new Date(now.getFullYear(), 0, 1).toISOString();
    return { startDate: start, endDate: undefined };
  }
  if (/^\d{4}-\d{2}$/.test(filter)) {
    const [year, month] = filter.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  return { startDate: undefined, endDate: undefined };
};

export function useProfitLossReport() {
  const [reportData, setReportData] = useState<ProfitLossReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("THIS_MONTH");
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

  const handleExportCSV = () => {
    if (!reportData) return;

    const rows: string[][] = [
      ["LAPORAN LABA RUGI (PROFIT & LOSS)"],
      [`Periode: ${periodFilter}`],
      [`Tanggal Ekspor: ${new Date().toLocaleString("id-ID")}`],
      [""],
      ["RINGKASAN", "JUMLAH (IDR)"],
      ["Total Pendapatan (Omzet)", String(reportData.revenue ?? 0)],
      ["Beban Pokok Penjualan (HPP)", String(reportData.cogs ?? 0)],
      ["Total Laba Kotor", String(grossProfit)],
      ["Total Beban Operasional", String(totalExpenses)],
      ["Laba Bersih (Net Profit)", String(reportData.netProfit ?? 0)],
      [""],
      ["RINCIAN PENDAPATAN & BEBAN"],
      ["Kategori", "Keterangan", "Jumlah (IDR)"],
    ];

    (reportData.breakdown?.income || []).forEach((item) => {
      rows.push(["Pendapatan", item.label, String(item.amount)]);
    });

    rows.push(["HPP", "Beban Pokok Penjualan HPP", String(reportData.cogs ?? 0)]);

    (reportData.breakdown?.expenses || []).forEach((item) => {
      rows.push(["Beban Operasional", item.label, String(item.amount)]);
    });

    const csvContent =
      "\uFEFF" +
      rows
        .map((row) => row.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-laba-rugi-${periodFilter}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      handleExportCSV,
    },
  };
}
