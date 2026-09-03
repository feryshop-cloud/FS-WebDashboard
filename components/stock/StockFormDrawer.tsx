"use client";

import React, { useState, useEffect, Ref } from "react";
import Image from "next/image";
import {
  X,
  UploadCloud,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  PackagePlus,
  Edit3,
} from "lucide-react";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { formatRupiah } from "@/lib/utils";
import { UnifiedStockItem, GameItem, AccountItem } from "@/lib/hooks/features/useUnifiedStock";
import { PurchasePaymentStatus } from "@/types/database";

interface StockFormDrawerProps {
  mode: "create" | "edit";
  open: boolean;
  closing: boolean;
  onClose: () => void;
  drawerRef?: Ref<HTMLDivElement>;
  stockItem?: UnifiedStockItem | null;
  games: GameItem[];
  accounts: AccountItem[];
  onSubmitCreate: (formData: FormData) => Promise<{ success: boolean; error?: string } | undefined>;
  onSubmitEdit: (
    id: string,
    data: {
      name?: string;
      category?: string;
      account_details?: string;
      username?: string;
      password?: string;
      capital_price?: number;
      post_price?: number;
      status?: string;
      seller_info?: string;
      internal_notes?: string;
      images?: string[];
    },
    newFiles?: File[],
  ) => Promise<{ success: boolean; error?: string } | undefined>;
}

export function StockFormDrawer({
  mode,
  open,
  closing,
  onClose,
  drawerRef,
  stockItem,
  games,
  accounts,
  onSubmitCreate,
  onSubmitEdit,
}: StockFormDrawerProps) {
  const isEdit = mode === "edit";

  // Form Fields State
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [specs, setSpecs] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capitalPrice, setCapitalPrice] = useState<number | "">("");
  const [askingPrice, setAskingPrice] = useState<number | "">("");
  const [sellerInfo, setSellerInfo] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>("LUNAS");
  const [paymentAccountId, setPaymentAccountId] = useState("");

  // Images State
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state when drawer opens or mode/stockItem changes
  useEffect(() => {
    if (!open) return;

    setError("");
    setIsSubmitting(false);

    if (isEdit && stockItem) {
      setCategory(stockItem.category || "");
      setName(stockItem.name || "");
      setSpecs(stockItem.account_details || "");
      setUsername(stockItem.username || "");
      setPassword(stockItem.password || "");
      setCapitalPrice(stockItem.capital_price ? Number(stockItem.capital_price) : "");
      setAskingPrice(
        stockItem.current_price
          ? Number(stockItem.current_price)
          : stockItem.post_price
            ? Number(stockItem.post_price)
            : "",
      );
      setSellerInfo(stockItem.seller_info || "");
      setInternalNotes(stockItem.internal_notes || "");
      setStatus(stockItem.status || "AVAILABLE");
      setPaymentStatus((stockItem.purchase_payment_status as PurchasePaymentStatus) || "LUNAS");
      setPaymentAccountId("");

      const imgs =
        Array.isArray(stockItem.images) && stockItem.images.length > 0
          ? (stockItem.images as string[]).filter(Boolean)
          : Array.isArray(stockItem.image_urls) && stockItem.image_urls.length > 0
            ? (stockItem.image_urls as string[]).filter(Boolean)
            : stockItem.screenshot_url
              ? [stockItem.screenshot_url]
              : [];
      setExistingImages(imgs);
      setNewImageFiles([]);
    } else {
      // Create defaults
      setCategory("");
      setName("");
      setSpecs("");
      setUsername("");
      setPassword("");
      setCapitalPrice("");
      setAskingPrice("");
      setSellerInfo("");
      setInternalNotes("");
      setStatus("AVAILABLE");
      setPaymentStatus("LUNAS");
      setPaymentAccountId(accounts.length > 0 ? accounts[0].id : "");
      setExistingImages([]);
      setNewImageFiles([]);
    }
  }, [open, isEdit, stockItem, accounts]);

  const totalImageCount = existingImages.length + newImageFiles.length;

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("Silakan pilih kategori game.");
      return;
    }
    if (!name.trim()) {
      setError("Nama / judul akun wajib diisi.");
      return;
    }

    if (!isEdit && paymentStatus === "LUNAS" && !paymentAccountId) {
      setError("Pilih rekening sumber dana kas untuk pembayaran lunas.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && stockItem) {
        const res = await onSubmitEdit(
          stockItem.id,
          {
            name: name.trim(),
            category: category,
            account_details: specs.trim(),
            username: username.trim(),
            password: password.trim(),
            capital_price: Number(capitalPrice) || 0,
            post_price: Number(askingPrice) || 0,
            status: status,
            seller_info: sellerInfo.trim(),
            internal_notes: internalNotes.trim(),
            images: existingImages,
          },
          newImageFiles,
        );
        if (res && !res.success) {
          setError(res.error || "Gagal memperbarui stok.");
        }
      } else {
        const formData = new FormData();
        formData.append("category", category);
        formData.append("name", name.trim());
        formData.append("account_details", specs.trim());
        formData.append("username", username.trim());
        formData.append("password", password.trim());
        formData.append("capital_price", String(Number(capitalPrice) || 0));
        formData.append("post_price", String(Number(askingPrice) || 0));
        formData.append("current_price", String(Number(askingPrice) || 0));
        formData.append("seller_info", sellerInfo.trim());
        formData.append("internal_notes", internalNotes.trim());
        formData.append("purchase_payment_status", paymentStatus);
        if (paymentStatus === "LUNAS" && paymentAccountId) {
          formData.append("payment_account_id", paymentAccountId);
        }

        newImageFiles.forEach((file) => {
          formData.append("images", file);
        });

        const res = await onSubmitCreate(formData);
        if (res && !res.success) {
          setError(res.error || "Gagal menambah stok akun.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlideOverDrawer
      open={open}
      closing={closing}
      onClose={onClose}
      drawerRef={drawerRef}
      title={
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Edit3 className="h-5 w-5 text-blue-600" />
          ) : (
            <PackagePlus className="h-5 w-5 text-blue-600" />
          )}
          <span>{isEdit ? "Edit Data Stok Akun" : "Beli & Tambah Stok Baru"}</span>
        </div>
      }
      subtitle={
        isEdit
          ? "Perbarui detail akun game, kredensial, screenshot etalase, dan status ketersediaan."
          : "Catat transaksi pembelian akun baru, kredensial, dan langsung masukkan ke stok etalase."
      }
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-col justify-between overflow-hidden"
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: Kategori & Identitas Akun */}
          <div className="space-y-4">
            <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
              1. Kategori & Identitas Akun
            </h3>

            <div>
              <label className="text-foreground mb-1 block text-xs font-semibold">
                Kategori Game <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Pilih Kategori Game --</option>
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: MLBB Mythic Glory 150 Skin (Collector+Legend)"
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-foreground block text-xs font-semibold">
                  Spesifikasi & Rincian Akun
                </label>
                <span className="text-muted-foreground text-[11px]">
                  Format: Rank, Skin, Hero, Login Bind
                </span>
              </div>
              <textarea
                rows={3}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder={
                  "Rank: Mythic Glory 100*\nLogin: Moonton Sepaket Gmail Monsep\nSkin: 180 (Collector, Legend, Epic Limit)\nEmblem: Max All, Winrate 68%"
                }
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* SECTION 2: Galeri Foto / Screenshot Akun */}
          <div className="space-y-3">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
                2. Foto & Screenshot Akun
              </h3>
              <span className="text-muted-foreground text-xs font-medium">
                {totalImageCount}/20 Foto (Foto 1 = Cover)
              </span>
            </div>

            {/* Existing & New Images Preview Grid */}
            {totalImageCount > 0 && (
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="group border-border bg-muted relative aspect-square overflow-hidden rounded-xl border"
                  >
                    <Image
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-blue-600/90 px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1 right-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                      title="Hapus foto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Newly Selected Image Files */}
                {newImageFiles.map((file, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-blue-400 bg-blue-50/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Baru ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-emerald-600/90 px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                      Baru
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1 right-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                      title="Hapus foto baru"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone Upload Button */}
            {totalImageCount < 20 && (
              <label className="group border-border bg-muted/30 relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-blue-500 hover:bg-blue-50/20">
                <div className="flex flex-col items-center justify-center text-center">
                  <UploadCloud className="text-muted-foreground h-6 w-6 transition-colors group-hover:text-blue-500" />
                  <p className="text-foreground mt-1 text-xs font-medium">
                    <span className="font-semibold text-blue-600">Klik untuk upload foto</span> atau
                    seret file ke sini
                  </p>
                  <p className="text-muted-foreground text-[10px]">
                    PNG, JPG, WEBP (Maks 5MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (totalImageCount + files.length > 20) {
                      alert("Maksimal 20 foto yang dapat diunggah.");
                      return;
                    }
                    setNewImageFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {/* SECTION 3: Kredensial Login Akun */}
          <div className="space-y-4">
            <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
              3. Kredensial Login Akun Game
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Username / Email Login
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@email.com / username"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Password Login
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password login akun"
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 pr-9 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Finansial & Kulakan */}
          <div className="space-y-4">
            <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
              4. Transaksi Finansial & Seller
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Harga Modal HPP (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={capitalPrice}
                  onChange={(e) => setCapitalPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 500000"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-semibold">
                  Target Jual Etalase (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 750000"
                  className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-semibold">
                Info Penjual / Supplier
              </label>
              <input
                type="text"
                value={sellerInfo}
                onChange={(e) => setSellerInfo(e.target.value)}
                placeholder="Nama & no WA seller/supplier kulakan"
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-xs font-semibold">
                Catatan Internal (Opsional)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Catatan tambahan untuk tim admin"
                className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* SECTION 5: Status Stok & Finansial Kas */}
          <div className="space-y-4">
            <h3 className="border-border text-foreground border-b pb-2 text-xs font-bold tracking-wider uppercase">
              5. Status Stok & Pembayaran Kas
            </h3>

            {isEdit ? (
              <div className="space-y-3">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Status Ketersediaan Stok
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="AVAILABLE">AVAILABLE (Tersedia di Etalase)</option>
                    <option value="UNPOSTED">UNPOSTED (Draft / Belum Tayang)</option>
                    <option value="SOLD">SOLD (Terjual)</option>
                  </select>
                </div>

                <div className="border-border bg-muted/40 rounded-xl border p-3 text-xs">
                  <span className="text-muted-foreground block font-medium">
                    Status Pembayaran Kulakan:
                  </span>
                  <span
                    className={`mt-1 inline-block font-bold ${paymentStatus === "LUNAS" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {paymentStatus === "LUNAS"
                      ? "LUNAS (Tercatat di Ledger Kas)"
                      : "PENDING (Hutang Kulakan)"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-semibold">
                      Status Bayar Kulakan
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PurchasePaymentStatus)}
                      className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="LUNAS">LUNAS (Potong Kas)</option>
                      <option value="PENDING">PENDING (Hutang)</option>
                    </select>
                  </div>

                  {paymentStatus === "LUNAS" && (
                    <div>
                      <label className="text-foreground mb-1 block text-xs font-semibold">
                        Rekening Kas Sumber <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={paymentAccountId}
                        onChange={(e) => setPaymentAccountId(e.target.value)}
                        className="border-border bg-card text-foreground w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

                <div className="border-border bg-muted/30 rounded-xl border p-3.5">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={status === "AVAILABLE"}
                      onChange={(e) => setStatus(e.target.checked ? "AVAILABLE" : "UNPOSTED")}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="text-foreground font-semibold">
                        Langsung Publikasikan ke Storefront
                      </span>
                      <p className="text-muted-foreground mt-0.5">
                        {status === "AVAILABLE"
                          ? "Akun akan langsung berstatus AVAILABLE dan muncul di etalase web pembeli."
                          : "Akun akan berstatus UNPOSTED (dapat dipublikasikan kemudian)."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-border bg-card flex items-center justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-border bg-card text-muted-foreground hover:bg-muted rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>{isEdit ? "Simpan Perubahan Stok" : "Simpan & Masukkan ke Stok"}</span>
            )}
          </button>
        </div>
      </form>
    </SlideOverDrawer>
  );
}
