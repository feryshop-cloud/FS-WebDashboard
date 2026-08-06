"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
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

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const LOCKED_BUY_STATUSES: readonly string[] = [BuyStatus.SUCCESS, BuyStatus.FAILED];

function getPaymentBadgeClass(status: string) {
  if (status === PaymentStatus.PAID) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === PaymentStatus.EXPIRED) return "bg-rose-50 text-rose-600 border-rose-100";
  if (status === PaymentStatus.FAILED) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-orange-50 text-orange-600 border-orange-100";
}

function getBuyBadgeClass(status: string) {
  if (status === BuyStatus.SUCCESS) return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === BuyStatus.PROCESSING) return "bg-orange-50 text-orange-600 border-orange-100";
  if (status === BuyStatus.FAILED) return "bg-rose-50 text-rose-600 border-rose-100";
  return "bg-muted text-muted-foreground border-border";
}

export default function TopupOrdersPage() {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders({ page: 1, pageSize: 20 });
  }, [loadOrders]);

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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
            Top-Up Orders
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kelola pesanan top-up dari storefront, proses pengiriman (SN), dan status pesanan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadOrders({ page: 1, pageSize: pagination.pageSize })}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border-soft bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-faint-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            className="block w-full rounded-lg border border-border bg-muted py-2 pr-3 pl-10 text-foreground placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari order ID, nickname, atau ID game..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Filter className="h-4 w-4 text-faint-foreground" />
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-transparent text-sm font-medium text-foreground outline-none"
            >
              <option value="">Semua Status Pembayaran</option>
              {VALID_PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PaymentStatusLabel[s]}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-faint-foreground" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Filter className="h-4 w-4 text-faint-foreground" />
            <select
              value={buyStatus}
              onChange={(e) => setBuyStatus(e.target.value)}
              className="bg-transparent text-sm font-medium text-foreground outline-none"
            >
              <option value="">Semua Status Pengiriman</option>
              {VALID_BUY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BuyStatusLabel[s]}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-faint-foreground" />
          </div>
          <button
            onClick={handleApplyFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Terapkan
          </button>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-soft bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Game ID / Nickname
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Total Harga
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Pembayaran
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Tanggal
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Belum ada pesanan top-up yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="group transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 font-mono text-sm font-semibold whitespace-nowrap text-foreground">
                      {order.order_id}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                      <span className="block max-w-[200px] truncate" title={order.product_title}>
                        {order.product_title}
                      </span>
                      <span className="mt-0.5 block text-xs text-faint-foreground">{order.game_slug}</span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                      <span className="block">{order.id_games}</span>
                      {order.nickname && (
                        <span className="mt-0.5 block text-xs text-faint-foreground">
                          {order.nickname}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-foreground">
                      {formatRupiah(Number(order.total_price))}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPaymentBadgeClass(order.payment_status)}`}
                      >
                        {PaymentStatusLabel[order.payment_status as PaymentStatus] ||
                          order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getBuyBadgeClass(order.buy_status)}`}
                      >
                        {BuyStatusLabel[order.buy_status as BuyStatus] || order.buy_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOrder(order)}
                        disabled={LOCKED_BUY_STATUSES.includes(order.buy_status)}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {LOCKED_BUY_STATUSES.includes(order.buy_status) ? "Selesai" : "Proses"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border-soft bg-card px-6 py-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{startFrom}</span> -{" "}
            <span className="font-semibold text-foreground">{endTo}</span> dari{" "}
            <span className="font-semibold text-foreground">{pagination.total}</span> pesanan
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <span className="px-3 text-sm font-medium text-foreground">
              Hal {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing Modal (Slide-over) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-card shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-border-soft bg-muted px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Proses Pesanan</h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedOrder.order_id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-card p-2 text-faint-foreground shadow-sm transition-colors hover:text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {modalError && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-600">
                  {modalSuccess}
                </div>
              )}
              {selectedOrder && LOCKED_BUY_STATUSES.includes(selectedOrder.buy_status) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Pesanan ini sudah <strong>{BuyStatusLabel[selectedOrder.buy_status as BuyStatus]}</strong> dan tidak dapat diubah.
                </div>
              )}

              {/* Order details */}
              <div className="rounded-xl border border-border-soft bg-muted p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Detail Pesanan</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Produk</dt>
                    <dd className="text-right font-medium text-foreground">
                      {selectedOrder.product_title}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Game</dt>
                    <dd className="text-right font-medium text-foreground">
                      {selectedOrder.game_slug}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">ID Game</dt>
                    <dd className="text-right font-mono text-foreground">
                      {selectedOrder.id_games}
                    </dd>
                  </div>
                  {selectedOrder.server_games && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Server</dt>
                      <dd className="text-right font-mono text-foreground">
                        {selectedOrder.server_games}
                      </dd>
                    </div>
                  )}
                  {selectedOrder.nickname && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Nickname</dt>
                      <dd className="text-right text-foreground">{selectedOrder.nickname}</dd>
                    </div>
                  )}
                  {selectedOrder.account_data &&
                    typeof selectedOrder.account_data === "object" &&
                    Object.entries(selectedOrder.account_data as Record<string, unknown>).map(
                      ([key, val]) => {
                        if (key === "id" || key === "server") return null; // already shown above
                        return (
                          <div key={key} className="flex justify-between gap-4">
                            <dt className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</dt>
                            <dd className="text-right font-mono text-foreground select-all">
                              {String(val ?? "-")}
                            </dd>
                          </div>
                        );
                      },
                    )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Qty</dt>
                    <dd className="text-right font-medium text-foreground">
                      {selectedOrder.quantity}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Harga Satuan</dt>
                    <dd className="text-right text-foreground">
                      {formatRupiah(Number(selectedOrder.price))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Fee</dt>
                    <dd className="text-right text-foreground">
                      {formatRupiah(Number(selectedOrder.fee))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-border pt-2">
                    <dt className="font-semibold text-foreground">Total</dt>
                    <dd className="font-bold text-foreground">
                      {formatRupiah(Number(selectedOrder.total_price))}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Payment info */}
              <div className="rounded-xl border border-border-soft bg-muted p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Informasi Pembayaran</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Metode</dt>
                    <dd className="text-right font-medium text-foreground">
                      {selectedOrder.payment_name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Kode Bayar</dt>
                    <dd className="text-right font-mono text-foreground">
                      {selectedOrder.payment_code_display || selectedOrder.payment_code}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPaymentBadgeClass(selectedOrder.payment_status)}`}
                      >
                        {PaymentStatusLabel[selectedOrder.payment_status as PaymentStatus] ||
                          selectedOrder.payment_status}
                      </span>
                    </dd>
                  </div>
                  {(selectedOrder.whatsapp || selectedOrder.email) && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Kontak</dt>
                      <dd className="text-right text-foreground">
                        {[selectedOrder.whatsapp, selectedOrder.email].filter(Boolean).join(" · ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Fulfillment form */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Serial Number (SN / Bukti Pengiriman)
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.serial_number || ""}
                    onChange={(e) =>
                      setSelectedOrder({ ...selectedOrder, serial_number: e.target.value })
                    }
                    placeholder="Masukkan SN atau bukti pengiriman..."
                    disabled={LOCKED_BUY_STATUSES.includes(selectedOrder.buy_status)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-faint-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Ubah Status Pesanan
                  </label>
                  <select
                    value={selectedOrder.buy_status}
                    onChange={(e) =>
                      setSelectedOrder({ ...selectedOrder, buy_status: e.target.value })
                    }
                    disabled={LOCKED_BUY_STATUSES.includes(selectedOrder.buy_status)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-faint-foreground"
                  >
                    {VALID_BUY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {BuyStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-border-soft bg-card p-6">
              <button
                onClick={handleSaveOrder}
                disabled={isSaving || (selectedOrder && LOCKED_BUY_STATUSES.includes(selectedOrder.buy_status))}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
