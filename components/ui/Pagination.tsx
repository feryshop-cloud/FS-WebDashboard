import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "data",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="border-border-soft bg-card flex flex-col gap-4 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        Menampilkan <span className="text-foreground font-semibold">{startItem}</span> -{" "}
        <span className="text-foreground font-semibold">{endItem}</span> dari{" "}
        <span className="text-foreground font-semibold">{totalItems}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </button>

        <span className="text-muted-foreground px-2 text-xs font-semibold">
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
