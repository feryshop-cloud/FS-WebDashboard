"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function ExportButton({ status, gameId }: { status?: string; gameId?: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (gameId) params.set("gameId", gameId);

      const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
      const basePath =
        routePrefix && routePrefix !== "/" ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}` : "";

      const response = await fetch(`${basePath}/api/export/inventory?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Laporan_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal mengekspor data";
      alert(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <Download className="h-4 w-4" strokeWidth={2} />
      )}
      <span>Download Laporan (Excel)</span>
    </button>
  );
}
