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
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
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
          <tbody className="divide-y divide-border-soft">
            {inventory && inventory.length > 0 ? (
              inventory.map((item: InventoryItemWithGame) => (
                <Fragment key={item.id}>
                  <tr
                    onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                    className={`group cursor-pointer transition-colors hover:bg-muted/50 ${expandedRowId === item.id ? "bg-muted/50" : ""}`}
                  >
                    <td
                      className="truncate px-3 py-2 font-medium text-foreground"
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
                      className="truncate px-3 py-2 text-muted-foreground"
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
                    <td className="truncate px-3 py-2 text-muted-foreground">
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
                        <button className="rounded-[10px] p-2 text-faint-foreground transition-colors hover:bg-muted hover:text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {expandedRowId === item.id && (
                    <tr className="border-b border-border-soft/50 bg-muted/50">
                      <td colSpan={columnCount} className="px-4 py-4 whitespace-normal">
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 text-[13px] shadow-sm md:grid-cols-2">
                          <div>
                            <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint-foreground uppercase">
                              Detail Referensi & Game
                            </span>
                            <p className="mb-0.5 font-medium text-foreground">
                              {item.title_reference}
                            </p>
                            <p className="text-muted-foreground">{item.games?.name || "Unknown Game"}</p>
                          </div>
                          <div>
                            <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint-foreground uppercase">
                              Status Transaksi
                            </span>
                            <p className="text-foreground">
                              <span className="font-medium text-foreground">Dibuat:</span>{" "}
                              {formatDate(item.created_at)}
                            </p>
                            {item.sold_at && (
                              <p className="mt-0.5 text-foreground">
                                <span className="font-medium text-foreground">Terjual:</span>{" "}
                                {formatDate(item.sold_at)}
                              </p>
                            )}
                            <p className="mt-0.5 text-foreground">
                              <span className="font-medium text-foreground">Target Jual:</span>{" "}
                              {formatCurrency(item.asking_price)}
                            </p>
                            {item.sold_price && (
                              <p className="mt-0.5 text-foreground">
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
                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
