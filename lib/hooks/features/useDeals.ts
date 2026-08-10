"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/error";
import { getDeals, createPenjualan, deleteDeal } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getDeals(),
        getInventory(),
        getAccounts(),
      ]);
      setDeals((dealsData as unknown as DealWithRelations[]) || []);
      setStocks((stocksResult.data || []).filter((s) => s.status === "AVAILABLE"));
      setAccounts(accountsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getDeals(), getInventory(), getAccounts()])
      .then(([dealsData, stocksResult, accountsData]) => {
        if (!active) return;
        setDeals((dealsData as unknown as DealWithRelations[]) || []);
        setStocks((stocksResult.data || []).filter((s) => s.status === "AVAILABLE"));
        setAccounts(accountsData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(deals.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = deals.slice(pageStart, pageStart + itemsPerPage);

  return {
    data: {
      deals,
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
      loadData,
    },
  };
}
