"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { formatRupiah } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getPurchases, purchaseStock, getGames, deletePurchase } from "@/actions/purchases";
import { getAccounts } from "@/app/actions/accounts";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { PurchaseWithRelations } from "@/types/database";

export type Purchase = PurchaseWithRelations;
export type Game = { id: string; name: string };
export type Account = { id: string; name: string; is_active: boolean; balance: number };

export function usePurchases() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, LUNAS, PENDING
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<"LUNAS" | "PENDING">("LUNAS");

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const closeAdd = () => {
    if (isAddClosing) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const addDrawerRef = useFocusTrap<HTMLDivElement>(isAddOpen || isAddClosing, null, closeAdd);

  const openAdd = () => {
    setError("");
    setIsAddOpen(true);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [purchasesRes, gamesRes, accountsData] = await Promise.all([
        getPurchases(),
        getGames(),
        getAccounts(),
      ]);
      setPurchases(purchasesRes.data || []);
      setGames(gamesRes.data || []);
      setAccounts((accountsData as unknown as Account[]) || []);
    } catch (err) {
      console.error("Error loading purchases data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getPurchases(), getGames(), getAccounts()])
      .then(([purchasesRes, gamesRes, accountsData]) => {
        if (!active) return;
        setPurchases(purchasesRes.data || []);
        setGames(gamesRes.data || []);
        setAccounts((accountsData as unknown as Account[]) || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAddPurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const category = formData.get("category") as string;
    const name = formData.get("name") as string;
    const account_details = formData.get("account_details") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const capital_price = parseFloat(formData.get("capital_price") as string) || 0;
    const post_price = parseFloat(formData.get("post_price") as string) || 0;
    const current_price = parseFloat(formData.get("current_price") as string) || post_price;
    const seller_info = formData.get("seller_info") as string;
    const internal_notes = formData.get("internal_notes") as string;
    const purchase_payment_status = formData.get("purchase_payment_status") as "LUNAS" | "PENDING";
    const payment_account_id = (formData.get("payment_account_id") as string) || null;

    if (!category || !name || !capital_price || !post_price) {
      setError("Kategori game, nama item, harga modal, dan harga post wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    if (purchase_payment_status === "LUNAS" && !payment_account_id) {
      setError("Target Rekening/Sumber Pembayaran wajib dipilih untuk status LUNAS.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await purchaseStock({
        category,
        name,
        account_details,
        username,
        password,
        capital_price,
        post_price,
        current_price,
        seller_info,
        internal_notes,
        purchase_payment_status,
        payment_account_id,
      });

      if (res.error) {
        setError(res.error);
      } else {
        closeAdd();
        loadData();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal menyimpan data pembelian."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch =
        query === "" ||
        purchase.sku?.toLowerCase().includes(query) ||
        purchase.name?.toLowerCase().includes(query) ||
        purchase.seller_info?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || purchase.purchase_payment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, query, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageNumber(1);
  }, [query, statusFilter]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / PAGE_SIZE));
  const safePage = Math.min(pageNumber, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredPurchases.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (!isFilterDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        filterButtonRef.current &&
        filterMenuRef.current &&
        !filterButtonRef.current.contains(target) &&
        !filterMenuRef.current.contains(target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterDropdownOpen(false);
        filterButtonRef.current?.focus();
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
  }, [isFilterDropdownOpen]);

  const handleExportData = () => {
    const rows = filteredPurchases.map((p) => {
      const isLunas = p.purchase_payment_status === "LUNAS";
      return [
        p.sku || "",
        p.name || "",
        p.category || "",
        p.seller_info || "",
        formatRupiah(p.capital_price ?? 0),
        p.accounts?.name || "",
        isLunas ? "Lunas" : "Pending",
      ];
    });
    const header = [
      "SKU",
      "Nama Item",
      "Kategori",
      "Supplier",
      "Harga Modal",
      "Metode Pembayaran",
      "Status",
    ];
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pembelian-stok-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeletePurchase = async (id: string, name?: string | null) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data pembelian stok "${name || ""}"?`)) {
      return;
    }
    try {
      const res = await deletePurchase(id);
      if (res.error) {
        alert("Gagal menghapus: " + res.error);
      } else {
        loadData();
      }
    } catch (err: unknown) {
      alert("Terjadi kesalahan: " + getErrorMessage(err));
    }
  };

  return {
    data: {
      purchases,
      games,
      accounts,
      filteredPurchases,
      pageItems,
      totalPages,
      safePage,
      pageStart,
      pageSize: PAGE_SIZE,
    },
    isLoading,
    isSubmitting,
    error,
    uiState: {
      isAddOpen,
      isAddClosing,
      searchQuery,
      statusFilter,
      isFilterDropdownOpen,
      pageNumber,
      selectedStatus,
    },
    refs: {
      filterButtonRef,
      filterMenuRef,
      addDrawerRef,
    },
    actions: {
      openAdd,
      closeAdd,
      handleAddPurchase,
      handleExportData,
      handleDeletePurchase,
      setSearchQuery,
      setStatusFilter,
      setIsFilterDropdownOpen,
      setPageNumber,
      setSelectedStatus,
      loadData,
    },
  };
}
