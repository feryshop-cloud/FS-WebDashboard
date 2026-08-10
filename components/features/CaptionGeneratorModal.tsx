"use client";

import { useState } from "react";
import { updateItemStatus } from "@/actions/inventory";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { InventoryItemWithGame } from "@/types/database";

export function CaptionGeneratorModal({
  item,
  isOpen,
  onClose,
}: {
  item: InventoryItemWithGame | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !item) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const captionText = `[Game] ${item.games?.name || "Game"} Account Available!\nRef: ${item.title_reference}\n\nSpecs:\n${item.account_specs}\n\nHarga: ${formatCurrency(item.asking_price)}\n\nDM for details!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleMarkAvailable = async () => {
    setIsUpdating(true);
    await updateItemStatus(item.id, "AVAILABLE");
    setIsUpdating(false);
    setCopied(false);
    onClose();
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 border-border bg-card flex w-full max-w-lg flex-col overflow-hidden rounded-[10px] border duration-200">
        <div className="border-border bg-muted/50 flex items-center justify-between border-b p-6">
          <h2 className="text-foreground text-lg font-semibold">Buat Caption</h2>
          <button
            onClick={handleClose}
            className="text-faint-foreground hover:bg-muted hover:text-muted-foreground tap-large rounded-[10px] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-6">
          <div className="border-border bg-muted text-foreground rounded-[10px] border p-5 text-sm leading-relaxed font-normal whitespace-pre-wrap">
            {captionText}
          </div>

          {!copied ? (
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center space-x-2 rounded-[10px] bg-blue-600 py-3 font-medium text-white transition-all hover:bg-blue-700"
            >
              <Copy className="h-5 w-5" />
              <span>Salin</span>
            </button>
          ) : (
            <div className="fs-drop-in space-y-4 rounded-[10px] border border-blue-100 bg-blue-50/50 p-6 text-center">
              <div className="mb-2 flex justify-center text-blue-600">
                <Check className="h-10 w-10 rounded-[10px] bg-blue-100 p-2" />
              </div>
              <div>
                <p className="text-foreground font-semibold">Caption disalin!</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Apakah kamu ingin menandai akun ini sebagai SIAP JUAL (AVAILABLE)?
                </p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="border-border bg-card text-foreground hover:bg-muted flex-1 rounded-[10px] border py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Tidak, Tetap Belum Posting
                </button>
                <button
                  onClick={handleMarkAvailable}
                  disabled={isUpdating}
                  className="flex flex-1 items-center justify-center rounded-[10px] bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-70"
                >
                  {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Ya, Tandai Siap Jual
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
