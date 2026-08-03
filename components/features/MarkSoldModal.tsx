"use client";

import { useState } from "react";
import { markItemAsSold } from "@/actions/inventory";
import { CheckCircle, X, Loader2 } from "lucide-react";
import { InventoryItemWithGame } from "@/types/database";

export function MarkSoldModal({
  item,
  isOpen,
  onClose,
}: {
  item: InventoryItemWithGame | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [soldPrice, setSoldPrice] = useState(item?.asking_price || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    const parsedPrice = Number(soldPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a valid final selling price.");
      setIsUpdating(false);
      return;
    }

    const result = await markItemAsSold(item.id, parsedPrice);
    setIsUpdating(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to update the item.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-md flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-6">
          <div className="flex items-center space-x-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-slate-900">Tandai Laku</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[10px] border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Harga Modal
                </p>
                <p className="font-semibold text-slate-700">{formatCurrency(item.capital_price ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Target Jual
                </p>
                <p className="font-semibold text-slate-900">{formatCurrency(item.asking_price)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700" htmlFor="soldPrice">
                Harga Laku Terjual (Rp)
              </label>
              <input
                id="soldPrice"
                type="number"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                min="0"
                required
                className="w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 text-slate-900 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-[10px] bg-rose-50 p-2 text-sm text-rose-600">{error}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex flex-1 items-center justify-center rounded-[10px] bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-70"
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Konfirmasi Terjual
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
