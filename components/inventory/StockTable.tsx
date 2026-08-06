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
            className="border-border-soft bg-card text-muted-foreground hover:bg-muted pointer-events-auto ml-1 flex h-8 w-8 items-center justify-center rounded-full border opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Right Fade & Button */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-6 z-10 flex w-20 items-center justify-end bg-gradient-to-l from-gray-50 to-transparent">
          <button
            onClick={scrollRight}
            className="border-border-soft bg-card text-muted-foreground hover:bg-muted pointer-events-auto mr-1 flex h-8 w-8 items-center justify-center rounded-full border opacity-0 shadow-md transition-opacity group-hover:opacity-100"
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
                  className={`bg-muted relative h-20 w-20 overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
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
                    <div className="bg-muted text-faint-foreground flex h-full w-full items-center justify-center">
                      <span className="text-xs font-medium">
                        {category.name === "Semua" ? "All" : "No Img"}
                      </span>
                    </div>
                  )}
                </div>
                <p
                  className={`mt-2.5 w-full truncate px-1 text-center text-xs font-medium tracking-tight transition-colors ${
                    isSelected
                      ? "text-blue-700"
                      : "text-muted-foreground group-hover/item:text-blue-600"
                  }`}
                >
                  {category.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-border bg-card flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border">
        <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full table-fixed whitespace-nowrap">
            <thead className="border-border bg-muted sticky top-0 z-10 border-b">
              <tr>
                <th className="text-muted-foreground w-40 px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                  Kode Stok
                </th>
                <th className="text-muted-foreground w-32 px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                  Kategori
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                  Detail (Login)
                </th>
                <th className="text-muted-foreground w-48 px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                  Harga
                </th>
                <th className="text-muted-foreground w-32 px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground w-28 px-4 py-3 text-right text-xs font-semibold tracking-wider uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="text-faint-foreground mb-3 h-10 w-10 stroke-[1.5]" />
                      <span className="text-muted-foreground text-sm">
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
                      className={`group hover:bg-muted/50 cursor-pointer transition-colors ${expandedRowId === stock.id ? "bg-muted" : ""}`}
                    >
                      <td
                        className="text-foreground truncate px-4 py-3 text-[13px] font-semibold"
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
                          <span className="text-foreground truncate font-medium">
                            {stock.username || "-"}
                          </span>
                          <span className="text-faint-foreground truncate text-[11px]">
                            ({stock.account_details || "-"})
                          </span>
                        </div>
                      </td>
                      <td
                        className="text-foreground truncate px-4 py-3 text-[13px]"
                        title={`${formatRupiah(stock.current_price)} (Modal: ${formatRupiah(stock.capital_price)})`}
                      >
                        <span className="truncate font-semibold">
                          {formatRupiah(stock.current_price)}
                        </span>
                        <span className="text-faint-foreground ml-1.5 truncate text-[11px]">
                          Modal: {formatRupiah(stock.capital_price)}
                        </span>
                      </td>
                      <td className="text-muted-foreground truncate px-4 py-3 text-[13px]">
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
                      <tr className="border-border-soft/50 bg-muted/50 border-b">
                        <td colSpan={6} className="px-4 py-4 whitespace-normal">
                          <div className="border-border bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 text-[13px] shadow-sm md:grid-cols-3">
                            <div>
                              <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                                Detail Akun
                              </span>
                              <p className="text-foreground mb-0.5 font-medium">{stock.name}</p>
                              <p className="text-muted-foreground">{stock.category}</p>
                            </div>
                            <div>
                              <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                                Kredensial Login
                              </span>
                              <p className="text-foreground">
                                <span className="text-foreground font-medium">User:</span>{" "}
                                {stock.username || "-"}
                              </p>
                              <p className="text-foreground mt-0.5">
                                <span className="text-foreground font-medium">Info:</span>{" "}
                                {stock.account_details || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="text-faint-foreground mb-1 block text-[11px] font-semibold tracking-wide uppercase">
                                Informasi Harga
                              </span>
                              <p className="text-foreground">
                                <span className="text-foreground font-medium">Harga Modal:</span>{" "}
                                {formatRupiah(stock.capital_price)}
                              </p>
                              <p className="text-foreground mt-0.5">
                                <span className="text-foreground font-medium">Harga Jual:</span>{" "}
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
