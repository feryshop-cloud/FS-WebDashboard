"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Download,
  Search,
  Key,
  Copy,
  Check,
  Loader2,
  Trash2,
  CreditCard,
  TrendingUp,
  Tag,
  AlertCircle,
  X,
  Edit2,
  ShieldCheck,
  UploadCloud,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { useUnifiedStock, UnifiedStockItem } from "@/lib/hooks/features/useUnifiedStock";
import { Pagination } from "@/components/ui/Pagination";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { PurchasePaymentStatus } from "@/types/database";

export default function UnifiedStockPage() {
  const {
    data: { games, accounts, kpis, totalItems, pageItems, safePage, totalPages, itemsPerPage },
    isLoading,
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
    refs: { addDrawerRef, settleModalRef },
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
    },
  } = useUnifiedStock();

  // Form State for Add Stock
  const [formCategory, setFormCategory] = useState("");
  const [formName, setFormName] = useState("");
  const [formSpecs, setFormSpecs] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formCapitalPrice, setFormCapitalPrice] = useState<number | "">("");
  const [formAskingPrice, setFormAskingPrice] = useState<number | "">("");
  const [formSellerInfo, setFormSellerInfo] = useState("");
  const [formInternalNotes, setFormInternalNotes] = useState("");
  const [formPaymentStatus, setFormPaymentStatus] = useState<PurchasePaymentStatus>("LUNAS");
  const [formPaymentAccountId, setFormPaymentAccountId] = useState("");
  const [formImages, setFormImages] = useState<File[]>([]);

  // Edit State
  const [editName, setEditName] = useState("");
  const [editCapitalPrice, setEditCapitalPrice] = useState<number | "">("");
  const [editPostPrice, setEditPostPrice] = useState<number | "">("");
  const [editSellerInfo, setEditSellerInfo] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Gallery Active Index
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenGalleryModal = (images: string[], title: string, startIndex = 0) => {
    setActiveGalleryIndex(startIndex);
    openGallery(images, title);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory) {
      alert("Pilih kategori game.");
      return;
    }
    if (!formName.trim()) {
      alert("Nama atau judul akun wajib diisi.");
      return;
    }
    if (formPaymentStatus === "LUNAS" && !formPaymentAccountId) {
      alert("Pilih rekening pembayaran kas untuk status LUNAS.");
      return;
    }

    const formData = new FormData();
    formData.append("category", formCategory);
    formData.append("name", formName.trim());
    formData.append("account_details", formSpecs.trim());
    formData.append("username", formUsername.trim());
    formData.append("password", formPassword.trim());
    formData.append("capital_price", String(Number(formCapitalPrice) || 0));
    formData.append("post_price", String(Number(formAskingPrice) || 0));
    formData.append("current_price", String(Number(formAskingPrice) || 0));
    formData.append("seller_info", formSellerInfo.trim());
    formData.append("internal_notes", formInternalNotes.trim());
    formData.append("purchase_payment_status", formPaymentStatus);
    if (formPaymentStatus === "LUNAS" && formPaymentAccountId) {
      formData.append("payment_account_id", formPaymentAccountId);
    }

    formImages.forEach((img) => {
      formData.append("images", img);
    });

    const res = await handleAddStockPurchase(formData);
    if (res?.success) {
      setFormCategory("");
      setFormName("");
      setFormSpecs("");
      setFormUsername("");
      setFormPassword("");
      setFormCapitalPrice("");
      setFormAskingPrice("");
      setFormSellerInfo("");
      setFormInternalNotes("");
      setFormPaymentStatus("LUNAS");
      setFormPaymentAccountId("");
      setFormImages([]);
    }
  };

  const handleOpenEdit = (stock: UnifiedStockItem) => {
    setEditName(stock.name || "");
    setEditCapitalPrice(stock.capital_price ? Number(stock.capital_price) : "");
    setEditPostPrice(
      stock.current_price
        ? Number(stock.current_price)
        : stock.post_price
          ? Number(stock.post_price)
          : "",
    );
    setEditSellerInfo(stock.seller_info || "");
    setEditInternalNotes(stock.internal_notes || "");

    const imgs = Array.isArray(stock.images)
      ? (stock.images as string[]).filter(Boolean)
      : Array.isArray(stock.image_urls)
        ? (stock.image_urls as string[]).filter(Boolean)
        : stock.screenshot_url
          ? [stock.screenshot_url]
          : [];
    setEditExistingImages(imgs);
    setEditNewImages([]);
    openEdit(stock);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockToEdit) return;

    setIsUpdating(true);
    await handleUpdateStock(
      selectedStockToEdit.id,
      {
        name: editName.trim(),
        capital_price: Number(editCapitalPrice) || 0,
        post_price: Number(editPostPrice) || 0,
        seller_info: editSellerInfo.trim(),
        internal_notes: editInternalNotes.trim(),
        images: editExistingImages,
      },
      editNewImages,
    );
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Page */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Stok Akun Game</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola stok akun siap jual dan catat transaksi pembelian akun baru secara terpadu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Beli & Tambah Stok
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border-soft bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Stok Tersedia
            </span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="text-foreground mt-2 text-2xl font-bold">{kpis.totalActive} Unit</p>
          <p className="text-muted-foreground mt-1 text-xs">Siap ditransaksikan di web</p>
        </div>

        <div className="border-border-soft bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Total Modal Stok (HPP)
            </span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-foreground mt-2 text-2xl font-bold">
            {formatRupiah(kpis.totalActiveValue)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Aset terikat pada stok aktif</p>
        </div>

        <div className="border-border-soft bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Akun Terjual
            </span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Tag className="h-4 w-4" />
            </span>
          </div>
          <p className="text-foreground mt-2 text-2xl font-bold">{kpis.totalSold} Akun</p>
          <p className="text-muted-foreground mt-1 text-xs">Telah laku terjual ke buyer</p>
        </div>

        <div className="border-border-soft bg-card rounded-2xl border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Hutang Beli Pending
            </span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <p className="text-foreground mt-2 text-2xl font-bold">
            {formatRupiah(kpis.totalPendingDebt)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Kewajiban bayar ke seller</p>
        </div>
      </div>

      {/* 3. Search & Multi-Filters Toolbar */}
      <div className="border-border-soft bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU, nama akun, seller..."
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground w-full rounded-xl border py-2 pr-4 pl-10 text-sm transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border-border bg-muted/50 text-foreground rounded-xl border px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Game</option>
            {games.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="border-border bg-muted/50 text-foreground rounded-xl border px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Stok</option>
            <option value="AVAILABLE">Tersedia (Ready)</option>
            <option value="SOLD">Terjual (Sold)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="border-border bg-muted/50 text-foreground rounded-xl border px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status Bayar</option>
            <option value="LUNAS">Lunas</option>
            <option value="PENDING">Pending (Hutang)</option>
          </select>
        </div>
      </div>

      {/* 4. Unified Stock Table */}
      <div className="border-border-soft bg-card overflow-hidden rounded-2xl border shadow-xs">
        <div className="overflow-x-auto">
          <table className="divide-border w-full divide-y text-left">
            <thead className="bg-muted/60 text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
              <tr>
                <th className="px-5 py-3.5">SKU & Tanggal</th>
                <th className="px-5 py-3.5">Foto & Akun Game</th>
                <th className="px-5 py-3.5">Kredensial</th>
                <th className="px-5 py-3.5">Harga Modal & Seller</th>
                <th className="px-5 py-3.5">Harga Jual</th>
                <th className="px-5 py-3.5">Status Stok</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                    <p className="mt-2 text-xs">Memuat data stok akun...</p>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground py-12 text-center">
                    <Package className="text-muted-foreground/50 mx-auto h-8 w-8" />
                    <p className="mt-2 font-medium">Tidak ada data stok ditemukan</p>
                    <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => {
                  const isAvailable = (item.status || "AVAILABLE").toUpperCase() === "AVAILABLE";
                  const isPending = item.purchase_payment_status === "PENDING";
                  const sellingPrice = Number(item.current_price || item.post_price) || 0;
                  const capitalPrice = Number(item.capital_price) || 0;
                  const estimatedMargin = sellingPrice - capitalPrice;

                  const allItemImages =
                    Array.isArray(item.images) && item.images.length > 0
                      ? (item.images as string[]).filter(Boolean)
                      : Array.isArray(item.image_urls) && item.image_urls.length > 0
                        ? (item.image_urls as string[]).filter(Boolean)
                        : item.screenshot_url
                          ? [item.screenshot_url]
                          : [];
                  const primaryThumbnail = allItemImages.length > 0 ? allItemImages[0] : null;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* SKU & Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-foreground font-mono text-xs font-bold">
                          {item.sku || `STK-${item.id.slice(0, 6).toUpperCase()}`}
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          {item.purchase_date ? formatDate(item.purchase_date) : "-"}
                        </p>
                      </td>

                      {/* Photo & Game & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Account Thumbnail / Image Preview */}
                          <div
                            onClick={() => {
                              if (allItemImages.length > 0) {
                                handleOpenGalleryModal(allItemImages, item.name || "Akun Game");
                              }
                            }}
                            className={`group relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${
                              allItemImages.length > 0
                                ? "cursor-pointer hover:ring-2 hover:ring-blue-500/50"
                                : ""
                            }`}
                          >
                            {primaryThumbnail ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={primaryThumbnail}
                                  alt={item.name || "Thumbnail"}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                {allItemImages.length > 1 && (
                                  <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1 text-[9px] font-bold text-white">
                                    +{allItemImages.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Info Text */}
                          <div className="max-w-xs">
                            <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              {item.category || "Game"}
                            </span>
                            <p className="text-foreground mt-0.5 truncate font-semibold">
                              {item.name || "-"}
                            </p>
                            {item.account_details && (
                              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                {item.account_details}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Credentials */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.username || item.password ? (
                          <button
                            onClick={() => openCredentials(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <Key className="h-3.5 w-3.5 text-slate-500" />
                            Intip Akun
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Belum diisi</span>
                        )}
                      </td>

                      {/* Capital & Seller */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-foreground font-semibold">
                          {formatRupiah(capitalPrice)}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPending
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isPending ? "PENDING (Hutang)" : "LUNAS"}
                          </span>
                          {item.seller_info && (
                            <span className="text-muted-foreground max-w-30 truncate text-xs">
                              • {item.seller_info}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-foreground font-bold">
                          {formatRupiah(sellingPrice)}
                        </span>
                        {sellingPrice > 0 && capitalPrice > 0 && (
                          <p className="text-[11px] font-medium text-emerald-600">
                            + {formatRupiah(estimatedMargin)}
                          </p>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isAvailable
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-blue-500"}`}
                          />
                          {isAvailable ? "AVAILABLE" : "SOLD"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => openSettle(item)}
                              className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                            >
                              Lunasi
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data Stok & Gambar"
                            className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(item.id)}
                            title="Hapus Stok"
                            className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <Pagination
            currentPage={safePage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {/* 5. SlideOverDrawer: Beli & Tambah Stok */}
      <SlideOverDrawer
        open={isAddOpen}
        closing={isAddClosing}
        onClose={closeAdd}
        title="Beli & Tambah Stok Baru"
        drawerRef={addDrawerRef}
      >
        <form onSubmit={handleAddSubmit} className="flex h-full flex-col justify-between">
          <div className="space-y-6 overflow-y-auto p-6">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Detail Akun Game */}
            <div className="space-y-4">
              <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
                1. Informasi Akun Game
              </h3>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Kategori Game <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Game --</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Nama / Judul Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: MLBB Mythic Glory 150 Skin"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Upload Screenshot Akun */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-foreground block text-xs font-semibold">
                    Screenshot Akun (Maks. 20)
                  </label>
                  <span className="text-muted-foreground text-[11px]">
                    {formImages.length}/20 gambar
                  </span>
                </div>

                {formImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formImages.map((file, idx) => (
                      <div
                        key={idx}
                        className="group border-border bg-muted relative aspect-square overflow-hidden rounded-xl border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formImages.length < 20 && (
                  <label className="group border-border bg-muted/30 relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-blue-500 hover:bg-blue-50/20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <UploadCloud className="text-muted-foreground h-6 w-6 transition-colors group-hover:text-blue-500" />
                      <p className="text-foreground mt-1 text-xs font-medium">
                        <span className="font-semibold text-blue-600">Klik untuk upload foto</span>{" "}
                        atau seret file
                      </p>
                      <p className="text-muted-foreground text-[10px]">PNG, JPG, WEBP (Maks 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (formImages.length + files.length > 20) {
                          alert("Maksimal 20 foto yang dapat diunggah.");
                          return;
                        }
                        setFormImages((prev) => [...prev, ...files]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Spesifikasi / Detail Akun
                </label>
                <textarea
                  rows={2}
                  value={formSpecs}
                  onChange={(e) => setFormSpecs(e.target.value)}
                  placeholder="Rank, skin langka, status email monsep, dsb..."
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Username / Email Login
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="user@email.com"
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Password Login
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Password"
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Transaksi Kulakan & Modal */}
            <div className="space-y-4">
              <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
                2. Transaksi Kulakan & Finansial
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Harga Modal (Beli) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={formCapitalPrice}
                    onChange={(e) =>
                      setFormCapitalPrice(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Rp 0"
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Target Jual (Etalase) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={formAskingPrice}
                    onChange={(e) =>
                      setFormAskingPrice(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Rp 0"
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Info Penjual / Supplier
                </label>
                <input
                  type="text"
                  value={formSellerInfo}
                  onChange={(e) => setFormSellerInfo(e.target.value)}
                  placeholder="Nama & no WA seller"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Status Bayar Kulakan
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as PurchasePaymentStatus)}
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="LUNAS">LUNAS (Potong Kas)</option>
                    <option value="PENDING">PENDING (Hutang)</option>
                  </select>
                </div>

                {formPaymentStatus === "LUNAS" && (
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Rekening Kas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formPaymentAccountId}
                      onChange={(e) => setFormPaymentAccountId(e.target.value)}
                      className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">-- Pilih Rekening --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatRupiah(acc.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Catatan Internal (Opsional)
                </label>
                <input
                  type="text"
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  placeholder="Catatan tambahan untuk admin"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-border bg-card border-t p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan & Menambah Stok...</span>
                </>
              ) : (
                <span>Simpan & Masukkan ke Stok</span>
              )}
            </button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* 6. Modal: Intip Kredensial & Foto Akun */}
      {isCredentialsOpen && selectedStockCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-card border-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-foreground font-bold">Detail & Kredensial Akun</h3>
              </div>
              <button
                onClick={closeCredentials}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">Item Akun</p>
                <p className="text-foreground mt-0.5 text-sm font-bold">
                  {selectedStockCredentials.name || "-"}
                </p>
              </div>

              {/* Foto Screenshots Gallery */}
              {(() => {
                const credImages =
                  Array.isArray(selectedStockCredentials.images) &&
                  selectedStockCredentials.images.length > 0
                    ? (selectedStockCredentials.images as string[]).filter(Boolean)
                    : Array.isArray(selectedStockCredentials.image_urls) &&
                        selectedStockCredentials.image_urls.length > 0
                      ? (selectedStockCredentials.image_urls as string[]).filter(Boolean)
                      : selectedStockCredentials.screenshot_url
                        ? [selectedStockCredentials.screenshot_url]
                        : [];

                if (credImages.length === 0) return null;

                return (
                  <div>
                    <span className="text-muted-foreground text-xs font-semibold">
                      Galeri Foto Akun ({credImages.length} Foto):
                    </span>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {credImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            handleOpenGalleryModal(
                              credImages,
                              selectedStockCredentials.name || "Foto Akun",
                              idx,
                            )
                          }
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-blue-500"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Foto ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Username / Email:</span>
                    <button
                      onClick={() =>
                        handleCopy(selectedStockCredentials.username || "", "username")
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {copiedKey === "username" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Salin
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 select-all">
                    {selectedStockCredentials.username || "-"}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Password:</span>
                    <button
                      onClick={() =>
                        handleCopy(selectedStockCredentials.password || "", "password")
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {copiedKey === "password" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Salin
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 select-all">
                    {selectedStockCredentials.password || "-"}
                  </p>
                </div>
              </div>

              {selectedStockCredentials.account_details && (
                <div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    Detail / Catatan Spesifikasi:
                  </span>
                  <p className="text-foreground bg-muted mt-1 rounded-lg p-2.5 font-mono text-xs whitespace-pre-wrap">
                    {selectedStockCredentials.account_details}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={closeCredentials}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Pelunasan Hutang Kulakan */}
      {isSettleOpen && selectedStockToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            ref={settleModalRef}
            className="bg-card border-border w-full max-w-md rounded-2xl border p-6 shadow-xl"
          >
            <h3 className="text-foreground text-lg font-bold">Pelunasan Pembelian Stok</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Pilih rekening kas yang digunakan untuk membayar hutang pembelian stok ini.
            </p>

            {settleError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {settleError}
              </div>
            )}

            <div className="border-border bg-muted/40 my-4 space-y-1.5 rounded-xl border p-3 text-xs">
              <p>
                <strong className="text-foreground">Item:</strong>{" "}
                {selectedStockToSettle.name || "-"}
              </p>
              <p>
                <strong className="text-foreground">Modal Beli:</strong>{" "}
                {formatRupiah(Number(selectedStockToSettle.capital_price) || 0)}
              </p>
              <p>
                <strong className="text-foreground">Seller:</strong>{" "}
                {selectedStockToSettle.seller_info || "-"}
              </p>
            </div>

            <div className="mb-5 space-y-2">
              <label className="text-foreground block text-xs font-semibold">
                Sumber Rekening Kas
              </label>
              <select
                value={settleAccountId}
                onChange={(e) => setSettleAccountId(e.target.value)}
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">-- Pilih Rekening --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatRupiah(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closeSettle}
                disabled={isSettling}
                className="border-border bg-card text-muted-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSettlePayment}
                disabled={isSettling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSettling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSettling ? "Memproses..." : "Konfirmasi Lunas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Edit Data Stok & Foto */}
      {isEditOpen && selectedStockToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-card border-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl">
            <div className="border-border flex items-center justify-between border-b pb-3">
              <h3 className="text-foreground font-bold">Edit Data Stok & Foto</h3>
              <button
                onClick={closeEdit}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Nama Akun
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Manage Existing & New Photos */}
              <div className="space-y-2">
                <label className="text-foreground block text-xs font-semibold">
                  Foto Screenshot Akun
                </label>

                {/* Existing Images */}
                {editExistingImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editExistingImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="group border-border bg-muted relative aspect-square overflow-hidden rounded-xl border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditExistingImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Image Uploads */}
                {editNewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {editNewImages.map((file, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-blue-300 bg-blue-50/50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${idx}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditNewImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="absolute right-0 bottom-0 left-0 bg-blue-600 py-0.5 text-center text-[9px] font-bold text-white">
                          Baru
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <label className="group border-border bg-muted/30 relative flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-blue-500 hover:bg-blue-50/20">
                  <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud className="text-muted-foreground h-5 w-5 transition-colors group-hover:text-blue-500" />
                    <p className="text-foreground mt-1 text-xs font-medium">
                      <span className="font-semibold text-blue-600">Tambah Screenshot Baru</span>
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setEditNewImages((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Harga Modal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editCapitalPrice}
                    onChange={(e) =>
                      setEditCapitalPrice(e.target.value ? Number(e.target.value) : "")
                    }
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Harga Jual
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPostPrice}
                    onChange={(e) => setEditPostPrice(e.target.value ? Number(e.target.value) : "")}
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Info Seller
                </label>
                <input
                  type="text"
                  value={editSellerInfo}
                  onChange={(e) => setEditSellerInfo(e.target.value)}
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Catatan Internal
                </label>
                <input
                  type="text"
                  value={editInternalNotes}
                  onChange={(e) => setEditInternalNotes(e.target.value)}
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={isUpdating}
                  className="border-border bg-card text-muted-foreground hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Lightbox Photo Gallery Modal */}
      {isGalleryOpen && galleryImages.length > 0 && (
        <div
          onClick={closeGallery}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-4xl flex-col items-center justify-center"
          >
            {/* Header / Info */}
            <div className="mb-3 flex w-full items-center justify-between text-white">
              <span className="max-w-md truncate text-sm font-semibold">{galleryTitle}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/70">
                  {activeGalleryIndex + 1} / {galleryImages.length}
                </span>
                <button
                  onClick={closeGallery}
                  className="rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Active Image */}
            <div className="relative flex max-h-[70vh] items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[activeGalleryIndex]}
                alt={`Screenshot ${activeGalleryIndex + 1}`}
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveGalleryIndex(
                        (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
                      )
                    }
                    className="absolute left-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveGalleryIndex((prev) => (prev + 1) % galleryImages.length)
                    }
                    className="absolute right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="mt-3 flex max-w-full gap-2 overflow-x-auto p-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activeGalleryIndex
                        ? "border-blue-500 ring-2 ring-blue-500/40"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
