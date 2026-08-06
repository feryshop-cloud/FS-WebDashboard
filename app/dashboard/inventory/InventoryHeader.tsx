"use client";

import { useState } from "react";
import { AddStockModal } from "@/components/inventory/AddStockModal";
import { Plus, Package } from "lucide-react";

import { Game } from "@/types/database";

interface InventoryHeaderProps {
  categories: Game[];
}

export function InventoryHeader({ categories }: InventoryHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-[10px] bg-blue-100 p-3 text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              Manajemen Inventori
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Kelola stok akun game, harga, dan ketersediaan.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 active:bg-blue-800 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Tambah Stok Baru
        </button>
      </div>

      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
      />
    </>
  );
}
