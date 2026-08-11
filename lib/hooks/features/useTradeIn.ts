"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import { getTradeInDeals, createTukarTambah } from "@/app/actions/trade-in";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
import type { Database } from "@/types/database.types";
import { TradeInWithRelations } from "@/types/database";

export type Deal = TradeInWithRelations;
export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};
export type Account = Database["public"]["Tables"]["accounts"]["Row"];

export function useTradeIn() {
  const [isAddTTOpen, setIsAddTTOpen] = useState(false);
  const [isAddTTClosing, setIsAddTTClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [priceOut, setPriceOut] = useState(0);
  const [ttValue, setTtValue] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: deals = [],
    isLoading: dealsLoading,
    mutate: mutateDeals,
  } = useSWR<Deal[]>("trade-in-deals", async () => {
    const result = await getTradeInDeals();
    return (result as unknown as TradeInWithRelations[]) || [];
  });

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    mutate: mutateStocks,
  } = useSWR<InventoryItem[]>("inventory-available", async () => {
    const result = await getInventory();
    if (result.error) throw new Error(result.error);
    return ((result.data || []) as unknown as InventoryItem[]).filter(
      (s) => s.status === "AVAILABLE",
    );
  });

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR<Account[]>("accounts", async () => {
    const result = await getAccounts();
    return result || [];
  });

  const isLoading = dealsLoading || stocksLoading || accountsLoading;

  const loadData = () => {
    mutateDeals();
    mutateStocks();
    mutateAccounts();
  };

  const closeAddTT = () => {
    if (isAddTTClosing || isSubmitting) return;
    setIsAddTTClosing(true);
    setTimeout(() => {
      setIsAddTTClosing(false);
      setIsAddTTOpen(false);
    }, 200);
  };

  const openAddTT = () => {
    if (isAddTTClosing) return;
    setIsAddTTOpen(true);
  };

  const handleAddTT = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createTukarTambah(formData);
      loadData();
      closeAddTT();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selisih = ttValue - priceOut;

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return deals.filter((tt) => {
      if (statusFilter) {
        const dealStatus = (tt.status as string) || "";
        if (statusFilter === "BOOKED" && dealStatus !== "BOOKED") return false;
        if (statusFilter === "PAID" && dealStatus !== "PAID") return false;
        if (statusFilter === "COMPLETED" && dealStatus !== "COMPLETED") return false;
        if (statusFilter === "CANCELLED" && !dealStatus.toUpperCase().includes("CANCEL"))
          return false;
      }

      if (!query) return true;

      const dealNumber = tt.deal_number?.toLowerCase() || "";
      const customerName =
        (tt.customers as { name?: string | null } | null)?.name?.toLowerCase() || "";
      const stockOutName = tt.deal_items?.[0]?.stocks?.name?.toLowerCase() || "";
      const tradeInItemsDesc = (tt.trade_in_items || [])
        .map((item) => String((item as { description?: string }).description || "").toLowerCase())
        .join(" ");

      return (
        dealNumber.includes(query) ||
        customerName.includes(query) ||
        stockOutName.includes(query) ||
        tradeInItemsDesc.includes(query)
      );
    });
  }, [deals, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (deals.length === 0) return;

    const headers = [
      "ID Transaksi",
      "Customer",
      "Aset Masuk (Aset Customer)",
      "Nilai Aset Masuk",
      "Stok Keluar (Feryshop)",
      "Nilai Stok Keluar",
      "Status",
      "Tanggal",
    ];

    const rows = deals.map((tt) => {
      const inItemsDesc = (tt.trade_in_items || [])
        .map((item) => String((item as { description?: string }).description || ""))
        .join(" & ");
      const inItemsValue = (tt.trade_in_items || []).reduce(
        (sum: number, item) =>
          sum + Number((item as { estimated_value?: number }).estimated_value || 0),
        0,
      );
      const stockOutName = tt.deal_items?.[0]?.stocks?.name || "N/A";

      return [
        tt.deal_number,
        (tt.customers as { name?: string | null } | null)?.name || "-",
        inItemsDesc || "-",
        inItemsValue,
        stockOutName,
        Number(tt.total_deal_price || 0),
        tt.status || "-",
        new Date(tt.created_at as string).toLocaleString("id-ID"),
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tukar-tambah-deals_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDeal = async (id: string) => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      const { deleteDeal } = await import("@/app/actions/deals");
      await deleteDeal(id);
      loadData();
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const [editTarget, setEditTarget] = useState<Deal | null>(null);

  const openEditTT = (tt: Deal) => {
    setEditTarget(tt);
    setPriceOut(Number(tt.total_deal_price || 0));
    const inValue = Number(
      (tt.trade_in_items?.[0] as { estimated_value?: number } | undefined)?.estimated_value || 0,
    );
    setTtValue(inValue);
    setPaymentAmount(Math.abs(Number(tt.total_deal_price || 0) - inValue));
    setError("");
  };

  const closeEditTT = () => {
    setEditTarget(null);
    setPriceOut(0);
    setTtValue(0);
    setPaymentAmount(0);
    setError("");
  };

  const handleUpdateTT = async (formData: FormData) => {
    try {
      if (!editTarget) return;
      setIsSubmitting(true);
      setError("");
      const { updateTukarTambah } = await import("@/app/actions/trade-in");
      await updateTukarTambah(editTarget.id, formData);
      loadData();
      closeEditTT();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = filteredDeals.slice(pageStart, pageStart + itemsPerPage);

  return {
    data: {
      deals,
      stocks,
      accounts,
      selisih,
      filteredDeals,
      pageItems,
      totalPages,
      safePage,
      pageStart,
      itemsPerPage,
      deleteTarget,
      deleteError,
      isDeleting,
      editTarget,
    },
    isLoading,
    isSubmitting,
    error,
    uiState: {
      isAddTTOpen,
      isAddTTClosing,
      priceOut,
      ttValue,
      paymentAmount,
      currentPage,
      itemsPerPage,
      searchQuery,
      statusFilter,
    },
    actions: {
      openAddTT,
      closeAddTT,
      handleAddTT,
      setPriceOut,
      setTtValue,
      setPaymentAmount,
      setCurrentPage,
      setItemsPerPage,
      setSearchQuery,
      setStatusFilter,
      handleExportCSV,
      setDeleteTarget,
      handleDeleteDeal,
      openEditTT,
      closeEditTT,
      handleUpdateTT,
      loadData,
    },
  };
}
