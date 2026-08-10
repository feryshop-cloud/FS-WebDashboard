"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import { getDeals, createPenjualan, deleteDeal } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { Database } from "@/types/database.types";
import { DealWithRelations } from "@/types/database";

export type Deal = DealWithRelations;
export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};
export type Account = Database["public"]["Tables"]["accounts"]["Row"];

export function useDeals() {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isAddDealClosing, setIsAddDealClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const {
    data: deals = [],
    isLoading: dealsLoading,
    mutate: mutateDeals,
  } = useSWR<Deal[]>("deals", async () => {
    const result = await getDeals();
    return (result as unknown as Deal[]) || [];
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

  const closeAddDeal = () => {
    if (isAddDealClosing || isSubmitting) return;
    setIsAddDealClosing(true);
    setTimeout(() => {
      setIsAddDealClosing(false);
      setIsAddDealOpen(false);
    }, 200);
  };

  const openAddDeal = () => {
    if (isAddDealClosing) return;
    setIsAddDealOpen(true);
  };

  const handleAddDeal = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createPenjualan(formData);
      loadData();
      closeAddDeal();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
      const basePath =
        routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";

      const response = await fetch(`${basePath}/api/export/deals?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Laporan_Deals_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Gagal mengunduh Excel";
      alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteDeal(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDeals = deals.filter((deal) => {
    if (statusFilter !== "ALL" && deal.status !== statusFilter) {
      return false;
    }
    if (dateFilter) {
      const dealDate = new Date(deal.created_at).toISOString().split("T")[0];
      if (dealDate !== dateFilter) {
        return false;
      }
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchNumber = deal.deal_number?.toLowerCase().includes(q);
      const matchCustomer = deal.customers?.name?.toLowerCase().includes(q);
      const matchStock = deal.deal_items?.some((item) =>
        item.stocks?.name?.toLowerCase().includes(q),
      );
      if (!matchNumber && !matchCustomer && !matchStock) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = filteredDeals.slice(pageStart, pageStart + itemsPerPage);

  return {
    data: {
      deals: filteredDeals,
      stocks,
      accounts,
      pageItems,
      totalPages,
      safePage,
      pageStart,
    },
    isLoading,
    isSubmitting,
    isExporting,
    isDeleting,
    error,
    deleteError,
    uiState: {
      isAddDealOpen,
      isAddDealClosing,
      currentPage,
      itemsPerPage,
      deleteTarget,
      searchQuery,
      statusFilter,
      dateFilter,
    },
    actions: {
      openAddDeal,
      closeAddDeal,
      handleAddDeal,
      handleExportExcel,
      handleDeleteDeal,
      setDeleteTarget,
      setCurrentPage,
      setItemsPerPage,
      setSearchQuery,
      setStatusFilter,
      setDateFilter,
      loadData,
    },
  };
}
