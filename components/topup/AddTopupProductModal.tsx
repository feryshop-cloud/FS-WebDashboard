"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { addTopupProduct } from "@/app/actions/topup-products";

interface AddTopupProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTopupProductModal({ isOpen, onClose, onSuccess }: AddTopupProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isClosing || isSubmitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData(e.currentTarget);
      const game_slug = formData.get("game_slug") as string;
      const title = formData.get("title") as string;
      const selling_price = Number(formData.get("selling_price"));
      const cost_price = Number(formData.get("cost_price"));
      const sku = formData.get("sku") as string;
      const brand = formData.get("brand") as string;
      const is_active = formData.get("is_active") === "true";
      const is_gangguan = formData.get("is_gangguan") === "true";

      const res = await addTopupProduct({
        game_slug,
        title,
        selling_price,
        cost_price,
        sku,
        brand,
        is_active,
        is_gangguan,
      });

      if (res.success) {
        onSuccess();
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          onClose();
        }, 200);
      } else {
        setError(res.error || "Gagal menambahkan produk.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm ${
        isClosing ? "fs-overlay-out" : "fs-overlay-in"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-card flex h-full w-full max-w-md flex-col shadow-2xl ${
          isClosing ? "fs-drawer-out" : "fs-drawer-in"
        }`}
      >
        <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-foreground text-lg font-bold">Tambah Produk Top-Up</h2>
            <p className="text-muted-foreground mt-1 text-xs">Isi form data produk top-up baru.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="bg-card text-faint-foreground hover:text-muted-foreground rounded-full p-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="fs-rise-in flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
            {error && (
              <div className="fs-drop-in rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label className="text-foreground mb-1 block font-medium">Nama Produk</label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. 86 Diamonds Mobile Legends"
                className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block font-medium">Game Slug</label>
              <input
                name="game_slug"
                type="text"
                required
                placeholder="e.g. mobile-legends"
                className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block font-medium">SKU / Kode Produk</label>
              <input
                name="sku"
                type="text"
                placeholder="e.g. ML86"
                className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block font-medium">Brand</label>
              <input
                name="brand"
                type="text"
                placeholder="e.g. Moonton"
                className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block font-medium">Harga Modal (Rp)</label>
                <input
                  name="cost_price"
                  type="number"
                  required
                  min="0"
                  placeholder="Rp 0"
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block font-medium">Harga Jual (Rp)</label>
                <input
                  name="selling_price"
                  type="number"
                  required
                  min="0"
                  placeholder="Rp 0"
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block font-medium">Status Produk</label>
                <select
                  name="is_active"
                  defaultValue="true"
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
              <div>
                <label className="text-foreground mb-1 block font-medium">Status Gangguan</label>
                <select
                  name="is_gangguan"
                  defaultValue="false"
                  className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="false">Normal</option>
                  <option value="true">Gangguan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-border-soft bg-card border-t p-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Produk</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
