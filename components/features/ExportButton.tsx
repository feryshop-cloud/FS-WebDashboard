"use client";

import { Download } from "lucide-react";
import { InventoryItemWithGame } from "@/types/database";

export function ExportButton({ data }: { data: InventoryItemWithGame[] }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const headers = [
      "Reference Code",
      "Game",
      "Status",
      "Capital Price",
      "Asking Price",
      "Sold Price",
      "Date Added",
    ];

    const rows = data.map((item) => [
      item.title_reference || "",
      item.games?.name || "",
      item.status || "",
      item.capital_price || 0,
      item.asking_price || 0,
      item.sold_price || "",
      new Date(item.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center space-x-2 rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      <span>Download Laporan (CSV)</span>
    </button>
  );
}
