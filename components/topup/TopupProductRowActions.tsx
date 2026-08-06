"use client";

import React, { useState } from "react";
import { MoreHorizontal, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteTopupProduct } from "@/app/actions/topup-products";
import { EditTopupProductModal } from "./TopupProductModals";

type TopupProduct = {
  id: string;
  game_slug: string;
  title: string;
  selling_price: number;
  cost_price: number;
  sku: string | null;
  is_active: boolean;
  is_gangguan: boolean;
};

interface TopupProductRowActionsProps {
  product: TopupProduct;
  onRefresh: () => void;
}

export function TopupProductRowActions({ product, onRefresh }: TopupProductRowActionsProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      const res = await deleteTopupProduct(product.id);
      if (res.success) {
        setIsDeleteOpen(false);
        onRefresh();
      } else {
        setDeleteError(res.error || "Gagal menghapus produk.");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        className="rounded-md p-1.5 text-faint-foreground hover:bg-muted hover:text-muted-foreground focus:outline-none"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpenMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpenMenu(false)} />
          <div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
            <button
              onClick={() => {
                setIsOpenMenu(false);
                setIsEditOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              Edit Produk
            </button>
            <button
              onClick={() => {
                setIsOpenMenu(false);
                setIsDeleteOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              Hapus Produk
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <EditTopupProductModal
        product={product}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Hapus Produk?</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus produk{" "}
              <span className="font-semibold text-foreground">{product.title}</span>? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
