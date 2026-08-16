import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "./cn";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "data",
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const options = pageSizeOptions.some((s) => s === itemsPerPage)
    ? pageSizeOptions
    : [...pageSizeOptions, itemsPerPage].sort((a, b) => a - b);

  const pages = pageWindow(currentPage, totalPages);

  return (
    <div className="border-border-soft bg-card flex flex-col gap-4 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-muted-foreground text-sm">
          Menampilkan <span className="text-foreground font-semibold">{startItem}</span> -{" "}
          <span className="text-foreground font-semibold">{endItem}</span> dari{" "}
          <span className="text-foreground font-semibold">{totalItems}</span> {itemLabel}
        </div>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs whitespace-nowrap">Tampil per hal:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border-border bg-card text-foreground tap-large rounded-md border text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {options.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="Ke halaman pertama"
          className="border-border bg-card text-foreground hover:bg-muted tap-large inline-flex h-9 items-center justify-center rounded-lg border px-2 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
          className="border-border bg-card text-foreground hover:bg-muted tap-large inline-flex items-center gap-1 rounded-lg border px-2.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="text-muted-foreground flex h-9 items-center px-1 text-xs"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={cn(
                "tap-large inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium shadow-sm transition-colors",
                p === currentPage
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Halaman selanjutnya"
          className="border-border bg-card text-foreground hover:bg-muted tap-large inline-flex items-center gap-1 rounded-lg border px-2.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Ke halaman terakhir"
          className="border-border bg-card text-foreground hover:bg-muted tap-large inline-flex h-9 items-center justify-center rounded-lg border px-2 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

        <span className="text-muted-foreground px-2 text-xs font-semibold whitespace-nowrap">
          Halaman {currentPage} dari {totalPages}
        </span>
      </div>
    </div>
  );
};
