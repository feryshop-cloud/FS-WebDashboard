"use client";

import { useState, useEffect, useCallback } from "react";
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
  if (status === PaymentStatus.PAID) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === PaymentStatus.EXPIRED) return "bg-rose-50 text-rose-600 border-rose-100";
  if (status === PaymentStatus.FAILED) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-orange-50 text-orange-600 border-orange-100";
}

export function getBuyBadgeClass(status: string) {
  if (status === BuyStatus.SUCCESS) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === BuyStatus.PROCESSING) return "bg-orange-50 text-orange-600 border-orange-100";
  if (status === BuyStatus.FAILED) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-muted text-muted-foreground border-border";
}

export function useTopupOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [buyStatus, setBuyStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const loadOrders = useCallback(async (filters: TopupOrdersFilters = {}) => {
    try {
      setIsLoading(true);
      const result: TopupOrdersResult = await getTopupOrders(filters);
      setOrders(result.data);
      setPagination({
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getTopupOrders({ page: 1, pageSize: 20 })
      .then((result: TopupOrdersResult) => {
        if (!active) return;
        setOrders(result.data);
        setPagination({
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleApplyFilters = () => {
    loadOrders({
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
    loadOrders({ page: 1, pageSize: pagination.pageSize });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    loadOrders({
      search: searchQuery,
      paymentStatus,
      buyStatus,
      page: nextPage,
      pageSize: pagination.pageSize,
    });
  };

  const handlePageSizeChange = (size: number) => {
    if (size === pagination.pageSize) return;
    loadOrders({
      search: searchQuery,
      paymentStatus,
      buyStatus,
      page: 1,
      pageSize: size,
    });
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
      loadOrders({
        search: searchQuery,
        paymentStatus,
        buyStatus,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
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
      loadOrders,
    },
  };
}
