import { useState, useEffect, useTransition } from "react";
import { getLedgerEntries } from "@/actions/ledger";
import { getErrorMessage } from "@/lib/error";
import { LedgerWithRelations } from "@/types/database";

const MONTHS = [
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

export function useCashflowReport() {
  const [entries, setEntries] = useState<LedgerWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [, startTransition] = useTransition();

  const loadData = () => {
    setIsLoading(true);
    setError("");
    getLedgerEntries()
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setEntries(res.data || []);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(getErrorMessage(err, "Gagal memuat data arus kas."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    getLedgerEntries()
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
        } else {
          setEntries(res.data || []);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setError(getErrorMessage(err, "Gagal memuat data arus kas."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter entries for the selected month and year
  const monthlyEntries = entries.filter((entry) => {
    const d = new Date(entry.created_at);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Filter entries for the table based on search
  const filteredEntries = monthlyEntries.filter((entry) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      (entry.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.account?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.transaction_type || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Aggregation
  let cashIn = 0;
  let cashOut = 0;

  let totalPaymentIn = 0;
  let totalTransferIn = 0;
  let totalRefundIn = 0;
  let totalCashbackIn = 0;
  let totalAdjustmentIn = 0;
  let totalOtherIn = 0;

  let totalStockPurchase = 0;
  let totalPaymentOut = 0;
  let totalRefundOut = 0;
  let totalCashbackOut = 0;
  let totalTransferOut = 0;
  let totalAdjustmentOut = 0;
  let totalOtherOut = 0;

  monthlyEntries.forEach((entry) => {
    const amt = Number(entry.amount);
    if (amt > 0) {
      cashIn += amt;
      switch (entry.transaction_type) {
        case "PAYMENT_IN":
          const desc = (entry.description || "").toLowerCase();
          if (desc.includes("dp") || desc.includes("cicilan") || desc.includes("down payment")) {
            totalCashbackIn += amt;
          } else {
            totalPaymentIn += amt;
          }
          break;
        case "TRANSFER_IN":
          totalTransferIn += amt;
          break;
        case "REFUND":
          totalRefundIn += amt;
          break;
        case "CASHBACK":
          totalCashbackIn += amt;
          break;
        case "ADJUSTMENT":
          totalAdjustmentIn += amt;
          break;
        default:
          totalOtherIn += amt;
          break;
      }
    } else if (amt < 0) {
      const absAmt = Math.abs(amt);
      cashOut += absAmt;
      switch (entry.transaction_type) {
        case "STOCK_PURCHASE":
          totalStockPurchase += absAmt;
          break;
        case "PAYMENT_OUT":
          totalPaymentOut += absAmt;
          break;
        case "REFUND":
          totalRefundOut += absAmt;
          break;
        case "CASHBACK":
          totalCashbackOut += absAmt;
          break;
        case "TRANSFER_OUT":
          totalTransferOut += absAmt;
          break;
        case "ADJUSTMENT":
          totalAdjustmentOut += absAmt;
          break;
        default:
          totalOtherOut += absAmt;
          break;
      }
    }
  });

  const netCashflow = cashIn - cashOut;

  const inflows = [
    { label: "Penerimaan Penjualan (Lunas)", amount: totalPaymentIn },
    { label: "Penerimaan DP / Cicilan", amount: totalCashbackIn },
    { label: "Transfer Masuk / Mutasi", amount: totalTransferIn },
    { label: "Penerimaan Refund / Batal", amount: totalRefundIn },
    { label: "Penyesuaian Saldo Masuk", amount: totalAdjustmentIn },
    { label: "Penerimaan Lainnya", amount: totalOtherIn },
  ].filter((item) => item.amount > 0);

  const outflows = [
    { label: "Pembayaran Pembelian Stok", amount: totalStockPurchase },
    { label: "Pengeluaran Operasional / Umum", amount: totalPaymentOut },
    { label: "Pengeluaran Refund / Batal", amount: totalRefundOut },
    { label: "Pengeluaran Cashback", amount: totalCashbackOut },
    { label: "Transfer Keluar / Mutasi", amount: totalTransferOut },
    { label: "Penyesuaian Saldo Keluar", amount: totalAdjustmentOut },
    { label: "Pengeluaran Lainnya", amount: totalOtherOut },
  ].filter((item) => item.amount > 0);

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;

    const headers = ["Tanggal", "Rekening", "Tipe Transaksi", "Keterangan", "Jumlah (IDR)"];
    const rows = filteredEntries.map((entry) => [
      new Date(entry.created_at).toLocaleString("id-ID"),
      entry.account?.name || "-",
      entry.transaction_type,
      entry.description || "-",
      entry.amount,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `arus-kas-${MONTHS[selectedMonth]}-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    data: {
      entries,
      monthlyEntries,
      filteredEntries,
      cashIn,
      cashOut,
      netCashflow,
      inflows,
      outflows,
    },
    isLoading,
    error,
    uiState: {
      selectedMonth,
      selectedYear,
      searchQuery,
      isMonthDropdownOpen,
      isYearDropdownOpen,
    },
    actions: {
      setSelectedMonth,
      setSelectedYear,
      setSearchQuery,
      setIsMonthDropdownOpen,
      setIsYearDropdownOpen,
      loadData: () => startTransition(() => loadData()),
      handleExportCSV,
    },
  };
}
