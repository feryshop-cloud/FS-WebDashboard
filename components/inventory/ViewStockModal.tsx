"use client";

import { useState } from "react";
import Image from "next/image";
import { Stock } from "@/types/database";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ViewStockModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewStockModal({ stock, isOpen, onClose }: ViewStockModalProps) {
  const [startIndex, setStartIndex] = useState(0);

  if (!isOpen) return null;

  const images = stock.images || [];
  const hasImages = images.length > 0;
  const totalImages = images.length;
  const visibleCount = 3;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(totalImages - visibleCount, prev + 1));
  };

  const visibleImages = images.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[10px] shadow-2xl">
        <div className="border-border-soft bg-card flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-foreground text-xl font-bold">{stock.name}</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">{stock.category}</p>
          </div>
          <button
            onClick={onClose}
            className="text-faint-foreground hover:bg-muted hover:text-foreground rounded-[10px] p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-muted/30 space-y-8 overflow-y-auto p-6">
          {/* Gallery Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground flex items-center gap-2 text-sm font-bold">
                <ImageIcon className="h-4 w-4 text-blue-500" />
                Image Gallery
              </h3>
              {totalImages > visibleCount && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={startIndex === 0}
                    className="border-border bg-card text-muted-foreground hover:bg-muted rounded-[10px] border p-1.5 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={startIndex >= totalImages - visibleCount}
                    className="border-border bg-card text-muted-foreground hover:bg-muted rounded-[10px] border p-1.5 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {hasImages ? (
              <div className="grid grid-cols-1 gap-4 transition-all duration-300 sm:grid-cols-3">
                {visibleImages.map((url, idx) => (
                  <div
                    key={url + idx}
                    className="group border-border/60 bg-muted relative aspect-video overflow-hidden rounded-[10px] border shadow-sm"
                  >
                    <Image
                      src={url}
                      alt={`Stock image ${startIndex + idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-border bg-muted text-faint-foreground flex w-full flex-col items-center justify-center rounded-[10px] border border-dashed py-12">
                <ImageIcon className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No images available for this stock.</p>
              </div>
            )}

            {hasImages && (
              <p className="text-faint-foreground mt-2 text-center text-xs font-medium">
                Showing {startIndex + 1}-{Math.min(startIndex + visibleCount, totalImages)} of{" "}
                {totalImages} images
              </p>
            )}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="border-border-soft bg-card space-y-4 rounded-[10px] border p-5 shadow-sm">
              <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                Account Credentials
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Username / Email
                  </p>
                  <p className="text-foreground text-sm font-medium">{stock.username || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Password
                  </p>
                  <p className="text-foreground font-mono text-sm">{stock.password || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Details / Note
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {stock.account_details || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-border-soft bg-card flex flex-col justify-between space-y-4 rounded-[10px] border p-5 shadow-sm">
              <div>
                <h3 className="text-faint-foreground mb-3 text-xs font-bold tracking-wider uppercase">
                  Pricing & Status
                </h3>

                <div className="border-border-soft flex items-center justify-between border-b py-2">
                  <span className="text-muted-foreground text-sm">Capital Price</span>
                  <span className="text-foreground font-mono text-sm font-medium">
                    {formatRupiah(stock.capital_price)}
                  </span>
                </div>
                <div className="border-border-soft flex items-center justify-between border-b py-2">
                  <span className="text-muted-foreground text-sm">Post Price</span>
                  <span className="text-foreground font-mono text-sm font-medium">
                    {formatRupiah(stock.post_price)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-sm font-semibold">Current Price</span>
                  <span className="font-mono text-lg font-black text-blue-600">
                    {formatRupiah(stock.current_price)}
                  </span>
                </div>
              </div>

              <div className="border-border-soft flex items-center justify-between border-t pt-4">
                <span className="text-faint-foreground text-xs">
                  Added {formatDate(stock.created_at)}
                </span>
                <StatusBadge status={stock.status} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
