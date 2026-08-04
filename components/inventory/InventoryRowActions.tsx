"use client";

import React, { useState } from "react";
import { MoreHorizontal, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteInventoryItem } from "@/app/actions/inventory";
import { EditInventoryModal } from "./EditInventoryModal";

type InventoryItem = {
  id: string;
  game_id: string;
  title_reference: string | null;
  account_specs: string | null;
  capital_price: number;
  asking_price: number;
  status: string | null;
  games?: { name: string; slug?: string } | null;
};

type Game = { id: string; name: string; slug: string };

interface InventoryRowActionsProps {
  item: InventoryItem;
  games: Game[];
  onRefresh: () => void;
}

export function InventoryRowActions({ item, games, onRefresh }: InventoryRowActionsProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      const res = await deleteInventoryItem(item.id);
      if (res.success) {
        setIsDeleteOpen(false);
        onRefresh();
      } else {
        setDeleteError(res.error || "Gagal menghapus stok.");
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
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpenMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpenMenu(false)} />
          <div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => {
                setIsOpenMenu(false);
                setIsEditOpen(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              Edit Data
            </button>
            <button
              onClick={() => {
                setIsOpenMenu(false);
                setIsDeleteOpen(true);
              }}
              disabled={item.status === "SOLD"}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              Hapus Stok
            </button>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <EditInventoryModal
        item={item}
        games={games}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Hapus Stok?</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus stok{" "}
              <span className="font-semibold text-slate-900">{item.title_reference || "ini"}</span>?
              Tindakan ini tidak dapat dibatalkan.
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
