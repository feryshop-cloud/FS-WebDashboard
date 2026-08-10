"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { getInventory, addInventoryItem, getGames } from "@/app/actions/inventory";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import type { Database } from "@/types/database.types";

export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};

export type Game = { id: string; name: string; slug: string };

export function useInventory() {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddStockClosing, setIsAddStockClosing] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeStatus, setActiveStatus] = useState("Semua Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCategoryDropdownOpen && !isStatusDropdownOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const categoryInside =
        categoryButtonRef.current?.contains(target) || categoryMenuRef.current?.contains(target);
      const statusInside =
        statusButtonRef.current?.contains(target) || statusMenuRef.current?.contains(target);

      if (isCategoryDropdownOpen && !categoryInside) {
        setIsCategoryDropdownOpen(false);
      }
      if (isStatusDropdownOpen && !statusInside) {
        setIsStatusDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isCategoryDropdownOpen) {
        setIsCategoryDropdownOpen(false);
        categoryButtonRef.current?.focus();
      }
      if (isStatusDropdownOpen) {
        setIsStatusDropdownOpen(false);
        statusButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategoryDropdownOpen, isStatusDropdownOpen]);

  const closeAddStock = () => {
    if (isAddStockClosing) return;
    setIsAddStockClosing(true);
    setTimeout(() => {
      setIsAddStockClosing(false);
      setIsAddStockOpen(false);
    }, 200);
  };

  const openAddStock = () => {
    setError("");
    setIsAddStockOpen(true);
  };

  const addStockRef = useFocusTrap<HTMLDivElement>(
    isAddStockOpen || isAddStockClosing,
    null,
    closeAddStock,
  );

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const result = await getInventory();
      if (result.error) {
        console.error("Error loading inventory:", result.error);
      } else {
        setInventory(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getInventory(), getGames()])
      .then(([invResult, gamesResult]) => {
        if (!active) return;
        if (!invResult.error && invResult.data) {
          setInventory(invResult.data as unknown as InventoryItem[]);
        }
        if (!gamesResult.error && gamesResult.data) {
          setGames(gamesResult.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [activeCategory, activeStatus, searchQuery, inventory.length]);

  const handleAddStock = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      const result = await addInventoryItem(formData);
      if (result.success) {
        closeAddStock();
        loadInventory();
      } else {
        setError(result.error || "Gagal menambah stok.");
      }
    } catch (err) {
      setError((err as { message?: string }).message || "Gagal menambah stok.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (activeCategory !== "Semua") {
        const game = games.find((g) => g.name === activeCategory);
        if (game) params.set("gameId", game.id);
      }
      const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
      const basePath =
        routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";

      const response = await fetch(`${basePath}/api/export/inventory?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Laporan_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
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

  const filteredInventory = useMemo(() => {
    return activeCategory === "Semua"
      ? inventory
      : inventory.filter((item) => item.games?.name === activeCategory);
  }, [inventory, activeCategory]);

  const displayedInventory = useMemo(() => {
    const searchQueryLower = searchQuery.trim().toLowerCase();
    return filteredInventory.filter((item) => {
      if (activeStatus !== "Semua Status" && item.status !== activeStatus) return false;
      if (!searchQueryLower) return true;
      const haystack = [item.public_id, item.title_reference, item.games?.name, item.account_specs]
        .filter((v): v is string => Boolean(v))
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQueryLower);
    });
  }, [filteredInventory, activeStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(displayedInventory.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = displayedInventory.slice(pageStart, pageStart + itemsPerPage);

  return {
    data: {
      inventory,
      games,
      displayedInventory,
      pageItems,
      totalPages,
      safePage,
      pageStart,
    },
    isLoading,
    isSubmitting,
    isExporting,
    error,
    uiState: {
      activeCategory,
      activeStatus,
      searchQuery,
      currentPage,
      itemsPerPage,
      isAddStockOpen,
      isAddStockClosing,
      isCategoryDropdownOpen,
      isStatusDropdownOpen,
    },
    refs: {
      categoryButtonRef,
      categoryMenuRef,
      statusButtonRef,
      statusMenuRef,
      addStockRef,
    },
    actions: {
      openAddStock,
      closeAddStock,
      handleAddStock,
      handleExportExcel,
      setActiveCategory,
      setActiveStatus,
      setSearchQuery,
      setCurrentPage,
      setItemsPerPage,
      setIsCategoryDropdownOpen,
      setIsStatusDropdownOpen,
      loadInventory,
    },
  };
}
