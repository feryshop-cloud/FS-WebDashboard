"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { updateInventoryItem } from "@/app/actions/inventory";

type InventoryItem = {
  id: string;
  game_id: string;
  title_reference: string | null;
  account_specs: string | null;
  capital_price: number;
  asking_price: number;
  games?: { name: string; slug?: string } | null;
};

type Game = { id: string; name: string; slug: string };

interface EditInventoryModalProps {
  item: InventoryItem;
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
            <h2 className="text-foreground text-lg font-bold">Edit Data Stok</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Ubah rincian informasi stok akun game.
            </p>
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
                className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                Kode Referensi
              </label>
              <input
                name="title_reference"
                type="text"
                required
                defaultValue={item.title_reference || ""}
                className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. ML-MYTHIC-001"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Spesifikasi Akun
              </label>
              <textarea
                name="account_specs"
                required
                rows={3}
                defaultValue={item.account_specs || ""}
                className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Details like rank, skins, win rate..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Harga Modal
                </label>
                <input
                  name="capital_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.capital_price}
                  className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Target Jual
                </label>
                <input
                  name="asking_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.asking_price}
                  className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
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
                  <span>Menyimpan...</span>
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
