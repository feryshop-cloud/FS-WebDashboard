"use client";

import React, { useState } from "react";
import { MoreHorizontal, Edit2, Trash2, Loader2, AlertTriangle, Globe, EyeOff } from "lucide-react";
import { deleteInventoryItem, updateItemStatus } from "@/app/actions/inventory";
import { EditInventoryModal, type InventoryItemToEdit } from "./EditInventoryModal";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

type Game = { id: string; name: string; slug: string };

interface InventoryRowActionsProps {
  item: InventoryItemToEdit;
  games: Game[];
  onRefresh: () => void;
}

export function InventoryRowActions({ item, games, onRefresh }: InventoryRowActionsProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const deleteDialogRef = useFocusTrap<HTMLDivElement>(
    isDeleteOpen,
    null,
    () => !isDeleting && setIsDeleteOpen(false),
  );

  const handleTogglePublish = async () => {
    try {
      setIsTogglingStatus(true);
      const newStatus = item.status === "AVAILABLE" ? "UNPOSTED" : "AVAILABLE";
      const res = await updateItemStatus(item.id, newStatus);
      if (res.success) {
        setIsOpenMenu(false);
        onRefresh();
      } else {
        alert(res.error || "Gagal mengubah status publikasi.");
      }
    } catch {
      alert("Terjadi kesalahan saat mengubah status.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

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
        aria-expanded={isOpenMenu}
        aria-haspopup="menu"
        aria-label="Aksi stok"
        className="text-faint-foreground hover:bg-muted hover:text-muted-foreground tap-large rounded-md focus:outline-none"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpenMenu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpenMenu(false)} />
          <div className="fs-drop-in border-border bg-card absolute right-0 z-30 mt-1 w-44 rounded-lg border py-1 shadow-lg">
            {item.status !== "SOLD" && (
              <button
                onClick={handleTogglePublish}
                disabled={isTogglingStatus}
                className="text-foreground hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-xs font-medium"
              >
                {item.status === "AVAILABLE" ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                    <span>Tarik ke Draft</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Publikasikan</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setIsOpenMenu(false);
                setIsEditOpen(true);
              }}
              className="text-foreground hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-xs font-medium"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              Edit Data & Foto
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
        <div
          ref={deleteDialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-stock-title"
          aria-describedby="delete-stock-desc"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="border-border bg-card w-full max-w-sm rounded-xl border p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-rose-600">
              <div className="rounded-full bg-rose-50 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 id="delete-stock-title" className="text-foreground text-lg font-bold">
                Hapus Stok?
              </h3>
            </div>
            <p id="delete-stock-desc" className="text-muted-foreground mb-4 text-sm">
              Apakah Anda yakin ingin menghapus stok{" "}
              <span className="text-foreground font-semibold">{item.title_reference || "ini"}</span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="tap-large flex items-center gap-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
