"use client";

import { useState, useRef, Fragment } from "react";
import Image from "next/image";
import { Stock, Game } from "@/types/database";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StockRowActions } from "./StockRowActions";
import { formatRupiah } from "@/lib/utils";
import { Inbox, ChevronLeft, ChevronRight } from "lucide-react";

interface StockTableProps {
  stocks: Stock[];
  categories: Game[];
}

export function StockTable({ stocks, categories }: StockTableProps) {
  const [activeGame, setActiveGame] = useState("Semua");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayCategories = [{ id: "all", name: "Semua", image_url: "" }, ...categories];

  const filteredStocks =
    activeGame === "Semua"
      ? stocks
      : stocks.filter((s) => s.category.toLowerCase() === activeGame.toLowerCase());

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden">
      {/* Visual Filter Bar */}
      <div className="group relative flex-shrink-0">
        {/* Left Fade & Button */}
        <div className="pointer-events-none absolute top-0 bottom-6 left-0 z-10 flex w-20 items-center justify-start bg-gradient-to-r from-gray-50 to-transparent">
          <button
            onClick={scrollLeft}
            className="pointer-events-auto ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-card text-muted-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Right Fade & Button */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-6 z-10 flex w-20 items-center justify-end bg-gradient-to-l from-gray-50 to-transparent">
          <button
            onClick={scrollRight}
            className="pointer-events-auto mr-1 flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-card text-muted-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex [scrollbar-width:none] items-start gap-4 overflow-x-auto scroll-smooth py-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {displayCategories.map((category) => {
            const isSelected = activeGame === category.name;
            return (
              <div
                key={category.id}
                onClick={() => setActiveGame(category.name)}
                className="group/item flex w-[88px] shrink-0 cursor-pointer flex-col items-center"
              >
                <div
                  className={`relative h-20 w-20 overflow-hidden rounded-2xl border bg-muted shadow-sm transition-all duration-300 ${
                    isSelected
                      ? "border-transparent opacity-100 ring-2 ring-blue-600 ring-offset-2"
                      : "border-border opacity-50 group-hover/item:border-blue-300 group-hover/item:opacity-100"
                  }`}
                >
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-faint-foreground">
                      <span className="text-xs font-medium">
                        {category.name === "Semua" ? "All" : "No Img"}
                      </span>
                    </div>
                  )}
                </div>
                <p
                  className={`mt-2.5 w-full truncate px-1 text-center text-xs font-medium tracking-tight transition-colors ${
                    isSelected ? "text-blue-700" : "text-muted-foreground group-hover/item:text-blue-600"
                  }`}
                >
                  {category.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed whitespace-nowrap">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted">
              <tr>
                <th className="w-40 px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Kode Stok
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Detail (Login)
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Harga
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Status
                </th>
                <th className="w-28 px-4 py-3 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="mb-3 h-10 w-10 stroke-[1.5] text-faint-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Tidak ada stok akun ditemukan untuk &quot;{activeGame}&quot;.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <Fragment key={stock.id}>
                    <tr
                      onClick={() => setExpandedRowId(expandedRowId === stock.id ? null : stock.id)}
                      className={`group cursor-pointer transition-colors hover:bg-muted/50 ${expandedRowId === stock.id ? "bg-muted" : ""}`}
                    >
                      <td
                        className="truncate px-4 py-3 text-[13px] font-semibold text-foreground"
                        title={stock.name}
                      >
                        {stock.name}
                      </td>
                      <td className="truncate px-4 py-3 text-[13px]">
                        <span
                          className="inline-flex truncate rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600"
                          title={stock.category}
                        >
                          {stock.category}
                        </span>
                      </td>
                      <td
                        className="truncate px-4 py-3 text-[13px]"
                        title={`${stock.username || "-"} (${stock.account_details || "-"})`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate font-medium text-foreground">
                            {stock.username || "-"}
                          </span>
                          <span className="truncate text-[11px] text-faint-foreground">
                            ({stock.account_details || "-"})
                          </span>
                        </div>
                      </td>
                      <td
                        className="truncate px-4 py-3 text-[13px] text-foreground"
                        title={`${formatRupiah(stock.current_price)} (Modal: ${formatRupiah(stock.capital_price)})`}
                      >
                        <span className="truncate font-semibold">
                          {formatRupiah(stock.current_price)}
                        </span>
                        <span className="ml-1.5 truncate text-[11px] text-faint-foreground">
                          Modal: {formatRupiah(stock.capital_price)}
                        </span>
                      </td>
                      <td className="truncate px-4 py-3 text-[13px] text-muted-foreground">
                        <StatusBadge status={stock.status} />
                      </td>
                      <td
                        className="truncate px-4 py-3 text-right text-[13px] font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StockRowActions stock={stock} categories={categories} />
                      </td>
                    </tr>
                    {expandedRowId === stock.id && (
                      <tr className="border-b border-border-soft/50 bg-muted/50">
                        <td colSpan={6} className="px-4 py-4 whitespace-normal">
                          <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 text-[13px] shadow-sm md:grid-cols-3">
                            <div>
                              <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint-foreground uppercase">
                                Detail Akun
                              </span>
                              <p className="mb-0.5 font-medium text-foreground">{stock.name}</p>
                              <p className="text-muted-foreground">{stock.category}</p>
                            </div>
                            <div>
                              <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint-foreground uppercase">
                                Kredensial Login
                              </span>
                              <p className="text-foreground">
                                <span className="font-medium text-foreground">User:</span>{" "}
                                {stock.username || "-"}
                              </p>
                              <p className="mt-0.5 text-foreground">
                                <span className="font-medium text-foreground">Info:</span>{" "}
                                {stock.account_details || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint-foreground uppercase">
                                Informasi Harga
                              </span>
                              <p className="text-foreground">
                                <span className="font-medium text-foreground">Harga Modal:</span>{" "}
                                {formatRupiah(stock.capital_price)}
                              </p>
                              <p className="mt-0.5 text-foreground">
                                <span className="font-medium text-foreground">Harga Jual:</span>{" "}
                                {formatRupiah(stock.current_price)}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
