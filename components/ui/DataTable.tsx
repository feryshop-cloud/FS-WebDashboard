import { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "./cn";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyContent?: ReactNode;
  loadingColor?: "blue";
  footer?: ReactNode;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
}

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const LOADING_CLASS: Record<string, string> = {
  blue: "text-blue-600",
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error,
  emptyMessage = "Belum ada data.",
  emptyContent,
  loadingColor = "blue",
  footer,
  onRowClick,
  sortKey,
  sortDir = "asc",
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        {error && (
          <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <table className="divide-border min-w-full divide-y">
          <thead className="bg-muted/80">
            <tr>
              {columns.map((col) => {
                const sortable = Boolean(col.sortable) && Boolean(onSort);
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      "text-muted-foreground px-6 py-4 text-xs font-semibold tracking-wider uppercase",
                      ALIGN_CLASS[col.align ?? "left"],
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        title="Urutkan"
                        className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 transition-colors"
                      >
                        {col.header}
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-border-soft bg-card divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <Loader2
                    className={cn("mx-auto h-8 w-8 animate-spin", LOADING_CLASS[loadingColor])}
                  />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-muted-foreground px-6 py-12 text-center text-sm"
                >
                  {emptyContent ?? emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group transition-colors",
                    onRowClick ? "cursor-pointer" : "",
                    "hover:bg-muted/50",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-6 py-4 text-sm",
                        ALIGN_CLASS[col.align ?? "left"],
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  );
}
