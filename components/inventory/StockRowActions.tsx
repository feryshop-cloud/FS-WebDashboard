"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Edit2, Trash2, Loader2, AlertTriangle, Eye } from "lucide-react";
import { Stock, Game } from "@/types/database";
import { deleteStock } from "@/actions/stocks";
import { EditStockModal } from "./EditStockModal";
import { ViewStockModal } from "./ViewStockModal";

interface StockRowActionsProps {
  stock: Stock;
  categories?: Game[];
}

export function StockRowActions({ stock, categories = [] }: StockRowActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const { success, error } = await deleteStock(stock.id);
      if (!success) {
        setDeleteError(error || "Gagal menghapus stok.");
      } else {
        setIsDeleteDialogOpen(false);
        setIsMenuOpen(false);
      }
    });
  };

  return (
    <div className="relative flex justify-end">
      <button
        onClick={toggleMenu}
        className="rounded-[10px] p-2 text-faint-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="animate-in fade-in zoom-in-95 absolute right-0 z-20 mt-10 w-48 rounded-[10px] border border-border-soft bg-card py-1 shadow-lg">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsViewModalOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Eye className="h-4 w-4 text-emerald-500" />
              Lihat Detail
            </button>
            <div className="my-1 h-px bg-muted" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditModalOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <Edit2 className="h-4 w-4 text-blue-500" />
              Edit Data
            </button>
            <div className="my-1 h-px bg-muted" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsDeleteDialogOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Stok
            </button>
          </div>
        </>
      )}

      {/* View Modal */}
      <ViewStockModal
        stock={stock}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      {/* Edit Modal */}
      <EditStockModal
        stock={stock}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={!isPending ? () => setIsDeleteDialogOpen(false) : undefined}
          />
          <div className="animate-in fade-in zoom-in-95 relative flex w-full max-w-md flex-col overflow-hidden rounded-[10px] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <div className="rounded-[10px] bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Hapus Stok?</h2>
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Anda yakin ingin menghapus stok <strong>{stock.name}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="mb-6 rounded-[10px] border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteError(null);
                }}
                disabled={isPending}
                className="rounded-[10px] border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 rounded-[10px] bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-70"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
