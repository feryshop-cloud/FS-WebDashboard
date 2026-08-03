"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateDealModal } from "./CreateDealModal";

export function DealsHeaderActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-[10px] bg-purple-600 px-5 py-2.5 font-semibold text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700 active:scale-95"
      >
        <Plus className="h-5 w-5" />
        Buat Transaksi Baru
      </button>

      <CreateDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
