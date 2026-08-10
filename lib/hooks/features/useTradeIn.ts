"use client";

import { useState, useEffect } from "react";
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [priceOut, setPriceOut] = useState(0);
  const [ttValue, setTtValue] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getTradeInDeals(),
        getInventory(),
        getAccounts(),
      ]);
      setDeals((dealsData as unknown as TradeInWithRelations[]) || []);
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
    Promise.all([getTradeInDeals(), getInventory(), getAccounts()])
      .then(([dealsData, stocksResult, accountsData]) => {
        if (!active) return;
        setDeals((dealsData as unknown as TradeInWithRelations[]) || []);
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
      await loadData();
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
