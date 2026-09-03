"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import {
  getPurchases,
  purchaseStock,
  getGames,
  deletePurchase,
  updatePurchase,
  settlePurchasePayment,
} from "@/actions/purchases";
import { getAccounts } from "@/app/actions/accounts";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { PurchasePaymentStatus } from "@/types/database";

export interface UnifiedStockItem {
  id: string;
  sku?: string | null;
  name?: string | null;
  category?: string | null;
  account_details?: string | null;
  username?: string | null;
  password?: string | null;
  capital_price?: number | null;
  post_price?: number | null;
  current_price?: number | null;
  status?: string | null;
  seller_info?: string | null;
  internal_notes?: string | null;
  purchase_payment_status?: PurchasePaymentStatus | null;
  purchase_date?: string | null;
  created_at?: string;
  images?: string[] | null;
  image_urls?: string[] | null;
  screenshot_url?: string | null;
  accounts?: { name: string } | null;
}

export type GameItem = { id: string; name: string };
export type AccountItem = { id: string; name: string; is_active: boolean; balance: number };

export function useUnifiedStock() {
  // Drawer / Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL"); // ALL, AVAILABLE, SOLD
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL"); // ALL, LUNAS, PENDING
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Settle Payment Modal State
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isSettleClosing, setIsSettleClosing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState("");
  const [selectedStockToSettle, setSelectedStockToSettle] = useState<UnifiedStockItem | null>(null);
  const [settleAccountId, setSettleAccountId] = useState("");

  // Credentials Modal State (Intip Username/Password)
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [selectedStockCredentials, setSelectedStockCredentials] = useState<UnifiedStockItem | null>(
    null,
  );

  // Edit Stock Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStockToEdit, setSelectedStockToEdit] = useState<UnifiedStockItem | null>(null);

  // Gallery Modal Lightbox State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");

  // Drawer & Modal refs for focus traps
  const closeAdd = () => {
    if (isAddClosing) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const openAdd = () => {
    setError("");
    setIsAddOpen(true);
  };

  const closeSettle = () => {
    if (isSettleClosing) return;
    setIsSettleClosing(true);
    setTimeout(() => {
      setIsSettleClosing(false);
      setIsSettleOpen(false);
      setSelectedStockToSettle(null);
      setSettleAccountId("");
      setSettleError("");
    }, 200);
  };

  const openSettle = (stock: UnifiedStockItem) => {
    setSelectedStockToSettle(stock);
    setSettleAccountId("");
    setSettleError("");
    setIsSettleOpen(true);
  };

  const openCredentials = (stock: UnifiedStockItem) => {
    setSelectedStockCredentials(stock);
    setIsCredentialsOpen(true);
  };

  const closeCredentials = () => {
    setIsCredentialsOpen(false);
    setSelectedStockCredentials(null);
  };

  const openEdit = (stock: UnifiedStockItem) => {
    setSelectedStockToEdit(stock);
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setSelectedStockToEdit(null);
  };

  const openGallery = (images: string[], title: string) => {
    setGalleryImages(images);
    setGalleryTitle(title);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    setGalleryImages([]);
    setGalleryTitle("");
  };

  const addDrawerRef = useFocusTrap<HTMLDivElement>(isAddOpen || isAddClosing, null, closeAdd);
  const settleModalRef = useFocusTrap<HTMLDivElement>(
    isSettleOpen || isSettleClosing,
    null,
    closeSettle,
  );

  // Data Fetching with SWR
  const stocksKey = "unified-stocks";
  const {
    data: stocks = [],
    isLoading: stocksLoading,
    mutate: mutateStocks,
  } = useSWR<UnifiedStockItem[]>(stocksKey, async () => {
    const res = await getPurchases();
    if (res.error) throw new Error(res.error);
    return (res.data as unknown as UnifiedStockItem[]) || [];
  });

  const gamesKey = "unified-games";
  const { data: games = [] } = useSWR<GameItem[]>(gamesKey, async () => {
    const res = await getGames();
    if (res.error) throw new Error(res.error);
    return res.data || [];
  });

  const accountsKey = "unified-accounts";
  const { data: accounts = [] } = useSWR<AccountItem[]>(accountsKey, async () => {
    const res = await getAccounts();
    return ((res as unknown as { accounts?: AccountItem[] })?.accounts || []).filter(
      (a: AccountItem) => a.is_active,
    );
  });

  // Calculate High-Level KPIs
  const kpis = useMemo(() => {
    let totalActive = 0;
    let totalActiveValue = 0;
    let totalSold = 0;
    let totalPendingDebt = 0;

    for (const item of stocks) {
      const isAvailable = (item.status || "AVAILABLE").toUpperCase() === "AVAILABLE";
      const isSold = (item.status || "").toUpperCase() === "SOLD";
      const isPendingPayment = item.purchase_payment_status === "PENDING";
      const capital = Number(item.capital_price) || 0;

      if (isAvailable) {
        totalActive += 1;
        totalActiveValue += capital;
      }
      if (isSold) {
        totalSold += 1;
      }
      if (isPendingPayment) {
        totalPendingDebt += capital;
      }
    }

    return {
      totalActive,
      totalActiveValue,
      totalSold,
      totalPendingDebt,
    };
  }, [stocks]);

  // Filtering
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // 1. Search Query
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const skuMatch = (stock.sku || "").toLowerCase().includes(q);
        const nameMatch = (stock.name || "").toLowerCase().includes(q);
        const categoryMatch = (stock.category || "").toLowerCase().includes(q);
        const sellerMatch = (stock.seller_info || "").toLowerCase().includes(q);
        const notesMatch = (stock.internal_notes || "").toLowerCase().includes(q);
        const userMatch = (stock.username || "").toLowerCase().includes(q);

        if (
          !skuMatch &&
          !nameMatch &&
          !categoryMatch &&
          !sellerMatch &&
          !notesMatch &&
          !userMatch
        ) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== "ALL") {
        const cat = String(stock.category || "").toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Stock Status Filter (AVAILABLE / SOLD)
      if (stockStatusFilter !== "ALL") {
        const itemStatus = String(stock.status || "AVAILABLE").toUpperCase();
        if (itemStatus !== stockStatusFilter) {
          return false;
        }
      }

      // 4. Payment Status Filter (LUNAS / PENDING)
      if (paymentStatusFilter !== "ALL") {
        if (stock.purchase_payment_status !== paymentStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [stocks, debouncedSearchQuery, categoryFilter, stockStatusFilter, paymentStatusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearchQuery, categoryFilter, stockStatusFilter, paymentStatusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, pageNumber), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const pageItems = filteredStocks.slice(startIndex, startIndex + itemsPerPage);

  // Actions
  const handleAddStockPurchase = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await purchaseStock(formData);
      if (!res.success || res.error) {
        throw new Error(res.error || "Gagal mencatat pembelian stok.");
      }

      await mutateStocks();
      closeAdd();
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettlePayment = async () => {
    if (!selectedStockToSettle) return;
    if (!settleAccountId) {
      setSettleError("Pilih rekening sumber pembayaran.");
      return;
    }

    setIsSettling(true);
    setSettleError("");

    try {
      const res = await settlePurchasePayment(selectedStockToSettle.id, settleAccountId);
      if (!res.success || res.error) {
        throw new Error(res.error || "Gagal melunasi pembayaran.");
      }

      await mutateStocks();
      closeSettle();
    } catch (err) {
      setSettleError(getErrorMessage(err));
    } finally {
      setIsSettling(false);
    }
  };

  const handleUpdateStock = async (
    id: string,
    data: {
      name?: string;
      capital_price?: number;
      post_price?: number;
      seller_info?: string;
      internal_notes?: string;
      images?: string[];
    },
    newFiles?: File[],
  ) => {
    try {
      const res = await updatePurchase(id, data, newFiles);
      if (!res.success || res.error) {
        throw new Error(res.error || "Gagal memperbarui stok.");
      }
      await mutateStocks();
      closeEdit();
      return { success: true };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const handleDeleteStock = async (id: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus stok akun ini? Seluruh riwayat pembelian dan ketersediaan akun di etalase akan dihapus.",
    );
    if (!confirmDelete) return;

    try {
      const res = await deletePurchase(id);
      if (!res.success || res.error) {
        throw new Error(res.error || "Gagal menghapus stok akun.");
      }
      await mutateStocks();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleExportData = () => {
    if (filteredStocks.length === 0) {
      alert("Tidak ada data stok untuk diexport.");
      return;
    }

    const headers = [
      "SKU",
      "Game",
      "Nama Akun",
      "Username",
      "Password",
      "Harga Modal (HPP)",
      "Harga Jual",
      "Status Stok",
      "Status Bayar Modal",
      "Supplier/Seller",
      "Rekening Kas",
      "Tanggal Masuk",
    ];

    const rows = filteredStocks.map((s) => [
      s.sku || "",
      s.category || "",
      `"${String(s.name || "").replace(/"/g, '""')}"`,
      `"${String(s.username || "").replace(/"/g, '""')}"`,
      `"${String(s.password || "").replace(/"/g, '""')}"`,
      s.capital_price || 0,
      s.current_price || s.post_price || 0,
      s.status || "AVAILABLE",
      s.purchase_payment_status || "LUNAS",
      `"${String(s.seller_info || "").replace(/"/g, '""')}"`,
      s.accounts?.name || "-",
      s.purchase_date ? formatDate(s.purchase_date) : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Stok_Akun_Feryshop_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    data: {
      stocks,
      games,
      accounts,
      kpis,
      totalItems: filteredStocks.length,
      pageItems,
      safePage,
      totalPages,
      itemsPerPage,
    },
    isLoading: stocksLoading,
    isSubmitting,
    isSettling,
    error,
    settleError,
    uiState: {
      searchQuery,
      categoryFilter,
      stockStatusFilter,
      paymentStatusFilter,
      isAddOpen,
      isAddClosing,
      isSettleOpen,
      isSettleClosing,
      selectedStockToSettle,
      settleAccountId,
      isCredentialsOpen,
      selectedStockCredentials,
      isEditOpen,
      selectedStockToEdit,
      isGalleryOpen,
      galleryImages,
      galleryTitle,
    },
    refs: {
      addDrawerRef,
      settleModalRef,
    },
    actions: {
      openAdd,
      closeAdd,
      openSettle,
      closeSettle,
      openCredentials,
      closeCredentials,
      openEdit,
      closeEdit,
      openGallery,
      closeGallery,
      setSettleAccountId,
      handleAddStockPurchase,
      handleSettlePayment,
      handleUpdateStock,
      handleDeleteStock,
      handleExportData,
      setSearchQuery,
      setCategoryFilter,
      setStockStatusFilter,
      setPaymentStatusFilter,
      setPageNumber,
      setItemsPerPage,
      mutateStocks,
    },
  };
}
