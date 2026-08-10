"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  getTopupOrders,
  updateTopupOrder,
  type TopupOrdersFilters,
  type TopupOrdersResult,
} from "@/app/actions/topup-orders";
import type { Database } from "@/types/database.types";
import {
  BuyStatus,
  BuyStatusLabel,
  PaymentStatus,
  PaymentStatusLabel,
  VALID_BUY_STATUSES,
  VALID_PAYMENT_STATUSES,
} from "@/types/status";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export const LOCKED_BUY_STATUSES: readonly string[] = [BuyStatus.SUCCESS, BuyStatus.FAILED];

export function getPaymentBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "paid") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (s === "expired") return "bg-rose-50 text-rose-600 border-rose-100";
  if (s === "failed") return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-orange-50 text-orange-600 border-orange-100";
}

export function getBuyBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "success") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (s === "processing") return "bg-orange-50 text-orange-600 border-orange-100";
  if (s === "failed") return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-muted text-muted-foreground border-border";
}

export function useTopupOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [buyStatus, setBuyStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<TopupOrdersFilters>({
    page: 1,
    pageSize: 10,
    search: "",
    paymentStatus: "",
    buyStatus: "",
  });

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setAppliedFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
      paymentStatus,
      buyStatus,
      page: 1,
    }));
  }, [debouncedSearch, paymentStatus, buyStatus]);

  const {
    data: resultData = { data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 },
    isLoading,
    mutate,
  } = useSWR<TopupOrdersResult>(["topup-orders", appliedFilters], async () => {
    return await getTopupOrders(appliedFilters);
  });

  const orders = resultData.data || [];
  const pagination = {
    total: resultData.total || 0,
    page: resultData.page || 1,
    pageSize: resultData.pageSize || 20,
    totalPages: resultData.totalPages || 1,
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      paymentStatus,
      buyStatus,
      page: 1,
      pageSize: pagination.pageSize,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPaymentStatus("");
    setBuyStatus("");
    setAppliedFilters({
      search: "",
      paymentStatus: "",
      buyStatus: "",
      page: 1,
      pageSize: pagination.pageSize,
    });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setAppliedFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  const handlePageSizeChange = (size: number) => {
    if (size === pagination.pageSize) return;
    setAppliedFilters((prev) => ({
      ...prev,
      page: 1,
      pageSize: size,
    }));
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      "Order ID",
      "Game",
      "Produk",
      "ID Game",
      "Server",
      "Nickname",
      "Qty",
      "Harga",
      "Fee",
      "Total",
      "Metode Pembayaran",
      "Payment Status",
      "Buy Status",
      "Serial Number",
      "WhatsApp",
      "Tanggal",
    ];

    const rows = orders.map((o) => [
      o.order_id,
      o.game_slug,
      o.product_title,
      o.id_games,
      o.server_games || "-",
      o.nickname || "-",
      o.quantity,
      Number(o.price || 0),
      Number(o.fee || 0),
      Number(o.total_price || 0),
      o.payment_name,
      o.payment_status,
      o.buy_status,
      o.serial_number || "",
      o.whatsapp || "",
      new Date(o.created_at).toLocaleString("id-ID"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "topup-orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenOrder = (order: OrderRow) => {
    setSelectedOrder(order);
    setModalError("");
    setModalSuccess("");
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    setModalError("");
    setModalSuccess("");

    const result = await updateTopupOrder(selectedOrder.id, {
      buy_status: selectedOrder.buy_status,
      serial_number: selectedOrder.serial_number || "",
    });

    if (result.success) {
      setModalSuccess("Pesanan berhasil diperbarui.");
      setSelectedOrder(null);
      mutate();
    } else {
      setModalError(result.error || "Gagal memperbarui pesanan.");
    }
    setIsSaving(false);
  };

  const startFrom = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endTo = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return {
    data: {
      orders,
      pagination,
      selectedOrder,
      startFrom,
      endTo,
    },
    isLoading,
    isSaving,
    modalError,
    modalSuccess,
    uiState: {
      searchQuery,
      paymentStatus,
      buyStatus,
    },
    helpers: {
      getPaymentBadgeClass,
      getBuyBadgeClass,
      LOCKED_BUY_STATUSES,
      BuyStatusLabel,
      PaymentStatusLabel,
      VALID_BUY_STATUSES,
      VALID_PAYMENT_STATUSES,
    },
    actions: {
      setSearchQuery,
      setPaymentStatus,
      setBuyStatus,
      setSelectedOrder,
      handleApplyFilters,
      handleResetFilters,
      handlePageChange,
      handlePageSizeChange,
      handleExportCSV,
      handleOpenOrder,
      handleSaveOrder,
      loadOrders: (_filters?: unknown) => mutate(),
    },
  };
}
