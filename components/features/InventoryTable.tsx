"use client";

import { useState, Fragment } from "react";
import { MoreHorizontal, Wand2, BadgeDollarSign } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CaptionGeneratorModal } from "@/components/features/CaptionGeneratorModal";
import { MarkSoldModal } from "@/components/features/MarkSoldModal";
import { InventoryItemWithGame } from "@/types/database";

interface InventoryTableProps {
  inventory: InventoryItemWithGame[];
  hideActions?: boolean;
}

export function InventoryTable({ inventory, hideActions = false }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithGame | null>(null);
  const [selectedSoldItem, setSelectedSoldItem] = useState<InventoryItemWithGame | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const columnCount = hideActions ? 6 : 6;

  return (
    <>
      <div className="border-border bg-card w-full overflow-x-auto rounded-xl border">
        <table className="w-full table-fixed text-left text-[13px] whitespace-nowrap">
          <thead className="border-b border-blue-700 bg-blue-600">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase"
              >
                Kode Ref
              </th>
              <th
                scope="col"
                className="w-40 px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase"
              >
                Game
              </th>
              <th
                scope="col"
                className="w-32 px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase"
              >
                Target Jual
              </th>
              {hideActions && (
                <th
                  scope="col"
                  className="w-32 px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase"
                >
                  Harga Laku
                </th>
              )}
              <th
                scope="col"
                className="w-28 px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase"
              >
                Status
              </th>
              <th
                scope="col"
                className={`w-36 px-3 py-2 text-[11px] font-semibold tracking-wide text-white uppercase`}
              >
                {hideActions ? "Tanggal Laku" : "Tanggal Masuk"}
              </th>
              {!hideActions && (
                <th
                  scope="col"
                  className="w-56 px-3 py-2 text-right text-[11px] font-semibold tracking-wide text-white uppercase"
                >
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-border-soft divide-y">
            {inventory && inventory.length > 0 ? (
              inventory.map((item: InventoryItemWithGame) => (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                    className={`group hover:bg-muted/50 cursor-pointer transition-colors ${expandedRowId === item.id ? "bg-muted/50" : ""}`}
                  >
                    <td
                      className="text-foreground truncate px-3 py-2 font-medium"
                      title={item.title_reference ?? undefined}
                    >
                      {item.title_reference}
                    </td>
                    <td className="truncate px-3 py-2">
                      <span
                        className="inline-flex truncate rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600"
                        title={item.games?.name || "Unknown"}
                      >
                        {item.games?.name || "Unknown"}
                      </span>
                    </td>
                    <td
                      className="text-muted-foreground truncate px-3 py-2"
                      title={formatCurrency(item.asking_price)}
                    >
                      {formatCurrency(item.asking_price)}
                    </td>
                    {hideActions && (
                      <td
                        className="truncate px-3 py-2 font-medium text-emerald-600"
                        title={item.sold_price ? formatCurrency(item.sold_price) : "—"}
                      >
                        {item.sold_price ? formatCurrency(item.sold_price) : "—"}
                      </td>
                    )}
                    <td className="truncate px-3 py-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="text-muted-foreground truncate px-3 py-2">
                      {hideActions && item.sold_at
                        ? formatDate(item.sold_at)
                        : formatDate(item.created_at)}
                    </td>
                    {!hideActions && (
                      <td
                        className="flex items-center justify-end space-x-2 truncate px-3 py-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.status === "UNPOSTED" && (
                          <button
                            onClick={() => setSelectedItem(item)}
                            title="Buat Caption"
                            className="flex items-center space-x-1 rounded-[10px] border border-blue-100/50 bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:bg-blue-100"
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Buat Caption</span>
                          </button>
                        )}
                        {(item.status === "UNPOSTED" || item.status === "AVAILABLE") && (
                          <button
                            onClick={() => {
                              setSelectedSoldItem(item);
                              setSelectedItem(null);
                            }}
                            title="Tandai Laku"
                            className="flex items-center space-x-1 rounded-[10px] border border-emerald-100/50 bg-emerald-50 px-3 py-1.5 text-emerald-600 transition-colors hover:bg-emerald-100"
                          >
                            <BadgeDollarSign className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-medium">Tandai Laku</span>
                          </button>
                        )}
                        <button className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-[10px] p-2 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {expandedRowId === item.id && (
                    <tr className="border-border-soft/50 bg-muted/50 border-b">
                      <td colSpan={columnCount} className="px-4 py-4 whitespace-normal">
                        <div className="border-border bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 text-[13px] shadow-sm md:grid-cols-2">
                          <div>
                            <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                              Detail Referensi & Game
                            </span>
                            <p className="text-foreground mb-0.5 font-medium">
                              {item.title_reference}
                            </p>
                            <p className="text-muted-foreground">
                              {item.games?.name || "Unknown Game"}
                            </p>
                          </div>
                          <div>
                            <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                              Status Transaksi
                            </span>
                            <p className="text-foreground">
                              <span className="text-foreground font-medium">Dibuat:</span>{" "}
                              {formatDate(item.created_at)}
                            </p>
                            {item.sold_at && (
                              <p className="text-foreground mt-0.5">
                                <span className="text-foreground font-medium">Terjual:</span>{" "}
                                {formatDate(item.sold_at)}
                              </p>
                            )}
                            <p className="text-foreground mt-0.5">
                              <span className="text-foreground font-medium">Target Jual:</span>{" "}
                              {formatCurrency(item.asking_price)}
                            </p>
                            {item.sold_price && (
                              <p className="text-foreground mt-0.5">
                                <span className="font-medium text-emerald-600">
                                  Harga Laku: {formatCurrency(item.sold_price)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columnCount}
                  className="text-muted-foreground px-4 py-12 text-center text-sm"
                >
                  Belum ada data akun di sini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!hideActions && (
        <>
          <CaptionGeneratorModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
          />

          <MarkSoldModal
            item={selectedSoldItem}
            isOpen={!!selectedSoldItem}
            onClose={() => setSelectedSoldItem(null)}
          />
        </>
      )}
    </>
  );
}
