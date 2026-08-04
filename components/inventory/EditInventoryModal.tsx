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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData(e.currentTarget);
      const result = await updateInventoryItem(item.id, formData);

      if (result.success) {
        onSuccess();
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Data Stok</h2>
            <p className="mt-1 text-xs text-slate-500">Ubah rincian informasi stok akun game.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {error && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Kategori Game</label>
              <select
                name="game_id"
                required
                defaultValue={item.game_id}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Kode Referensi
              </label>
              <input
                name="title_reference"
                type="text"
                required
                defaultValue={item.title_reference || ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. ML-MYTHIC-001"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Spesifikasi Akun
              </label>
              <textarea
                name="account_specs"
                required
                rows={3}
                defaultValue={item.account_specs || ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Details like rank, skins, win rate..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Harga Modal</label>
                <input
                  name="capital_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.capital_price}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Target Jual</label>
                <input
                  name="asking_price"
                  required
                  type="number"
                  min="0"
                  defaultValue={item.asking_price}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Rp 0"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white p-6">
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
