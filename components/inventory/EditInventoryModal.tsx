"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Loader2, UploadCloud, Trash2 } from "lucide-react";
import { updateInventoryItem } from "@/app/actions/inventory";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

export type InventoryItemToEdit = {
  id: string;
  game_id: string;
  title_reference: string | null;
  account_specs: string | null;
  capital_price: number;
  asking_price: number;
  status?: string | null;
  image_urls?: string[] | null;
  screenshot_url?: string | null;
  games?: { id?: string; name: string; slug?: string } | null;
};

type Game = { id: string; name: string; slug: string };

interface EditInventoryModalProps {
  item: InventoryItemToEdit;
  games: Game[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditInventoryModal({
  item,
  games,
  isOpen,
  onClose,
  onSuccess,
}: EditInventoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Existing and new images state
  const initialImages: string[] = Array.isArray(item.image_urls)
    ? item.image_urls.filter(Boolean)
    : item.screenshot_url
      ? [item.screenshot_url]
      : [];

  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [status, setStatus] = useState<string>(item.status || "AVAILABLE");

  const totalImageCount = existingImages.length + newImages.length;

  const handleClose = () => {
    if (isClosing || isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, null, handleClose);

  if (!isOpen) return null;

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData(e.currentTarget);
      formData.set("status", status);

      // Append retained existing image URLs
      existingImages.forEach((url) => {
        formData.append("existing_images", url);
      });

      // Append newly uploaded image files
      newImages.forEach((file) => {
        formData.append("images", file);
      });

      const result = await updateInventoryItem(item.id, formData);

      if (result.success) {
        onSuccess();
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          onClose();
        }, 200);
      } else {
        setError(result.error || "Gagal memperbarui stok.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-stock-drawer-title"
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
        isClosing ? "fs-overlay-out" : "fs-overlay-in"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-card flex h-full w-full max-w-lg flex-col shadow-2xl ${
          isClosing ? "fs-drawer-out" : "fs-drawer-in"
        }`}
      >
        <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 id="edit-stock-drawer-title" className="text-foreground text-lg font-bold">
              Edit Data Stok & Foto Akun
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Ubah rincian informasi stok, galeri screenshot, dan status publikasi di marketplace.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Tutup form Edit Data Stok"
            className="bg-card text-faint-foreground hover:text-muted-foreground tap-large rounded-full shadow-sm transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {error && (
              <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Kategori Game
              </label>
              <select
                name="game_id"
                required
                defaultValue={item.game_id}
                className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Pilih Kategori Game...</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Kode / Judul Akun
              </label>
              <input
                name="title_reference"
                type="text"
                required
                defaultValue={item.title_reference || ""}
                className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. ML-MYTHIC-001"
              />
            </div>

            {/* Galeri Screenshot Akun */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-foreground block text-sm font-medium">
                  Galeri Foto / Screenshot ({totalImageCount}/20)
                </label>
                <span className="text-muted-foreground text-xs">Foto pertama jadi cover utama</span>
              </div>

              {/* Existing & New Images List */}
              {totalImageCount > 0 && (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
                  {existingImages.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={url}
                        alt={`Screenshot ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="bg-card/90 text-foreground hover:bg-card absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600"
                        title="Hapus foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {newImages.map((file, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="group border-border relative aspect-square overflow-hidden rounded-lg border bg-blue-50/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${idx}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white">
                        Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="bg-card/90 text-foreground hover:bg-card absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600"
                        title="Batalkan upload"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              {totalImageCount < 20 && (
                <label className="border-border bg-muted hover:bg-muted/70 relative flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors">
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <UploadCloud className="h-4 w-4" />
                    <span className="font-semibold">Tambah Screenshot Baru</span>
                    <span className="text-muted-foreground">({20 - totalImageCount} slot)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (totalImageCount + files.length > 20) {
                        alert("Maksimal 20 gambar yang diperbolehkan.");
                        return;
                      }
                      setNewImages((prev) => [...prev, ...files]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Spesifikasi Akun
                </label>
                <span className="text-muted-foreground text-xs">Rank: ..., Login: ...</span>
              </div>
              <textarea
                name="account_specs"
                required
                rows={3}
                defaultValue={item.account_specs || ""}
                className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Rank: Mythic Glory\nLogin: Moonton Sepaket Gmail\nSkin: 120"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Harga Modal (Rp)
                </label>
                <input
                  name="capital_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.capital_price}
                  className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Target Jual (Rp)
                </label>
                <input
                  name="asking_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.asking_price}
                  className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Status Marketplace
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border-border bg-muted text-foreground w-full rounded-lg border px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="AVAILABLE">AVAILABLE (Tayang di Storefront)</option>
                <option value="UNPOSTED">UNPOSTED (Draft / Arsip Internal)</option>
                <option value="SOLD">SOLD (Terjual)</option>
              </select>
            </div>
          </div>

          <div className="border-border-soft bg-card border-t p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
