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
    if (!query) return deals;

    return deals.filter((tt) => {
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
  }, [deals, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery]);

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
      loadData,
    },
  };
}
