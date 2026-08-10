"use client";

import { useState } from "react";
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

  return {
    data: {
      deals,
      stocks,
      accounts,
      selisih,
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
    },
    actions: {
      openAddTT,
      closeAddTT,
      handleAddTT,
      setPriceOut,
      setTtValue,
      setPaymentAmount,
      loadData,
    },
  };
}
