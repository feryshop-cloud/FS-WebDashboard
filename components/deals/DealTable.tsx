"use client";

import Link from "next/link";
import { DealWithRelations } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

export function DealTable({ deals }: { deals: DealWithRelations[] }) {
  return (
    <div className="border-border bg-card overflow-x-auto rounded-[10px] border shadow-sm">
      <table className="divide-border min-w-full divide-y">
        <thead className="bg-muted">
          <tr>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Deal Number
            </th>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Customer
            </th>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Stock Code
            </th>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Deal Price
            </th>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Paid (%)
            </th>
            <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold tracking-wider uppercase">
              Status
            </th>
            <th className="text-muted-foreground px-6 py-4 text-right text-xs font-semibold tracking-wider uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-border bg-card divide-y">
          {deals.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-muted-foreground px-6 py-12 text-center text-sm">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-faint-foreground mb-2 text-2xl">📝</span>
                  <span>No active deals found.</span>
                </div>
              </td>
            </tr>
          ) : (
            deals.map((deal) => (
              <tr key={deal.id} className="group transition-colors hover:bg-blue-50/50">
                <td className="text-foreground px-6 py-4 font-mono text-sm font-semibold whitespace-nowrap">
                  {deal.deal_number}
                </td>
                <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                  <div className="text-foreground font-medium">{deal.customer_name}</div>
                  <div className="text-muted-foreground text-xs">
                    {deal.customer_contact || "-"}
                  </div>
                </td>
                <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                  {deal.stock?.name || "Unknown Stock"}
                </td>
                <td className="text-foreground px-6 py-4 font-mono text-sm font-medium whitespace-nowrap">
                  {formatRupiah(deal.deal_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground font-mono text-sm">
                      {formatRupiah(deal.total_paid)}
                    </span>
                    <div className="bg-muted h-1.5 w-full rounded-[10px]">
                      <div
                        className={`h-1.5 rounded-[10px] ${deal.payment_percentage >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                        style={{ width: `${Math.min(deal.payment_percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground text-[10px] font-semibold">
                      {deal.payment_percentage.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                  {(() => {
                    const statusConfig: Record<string, { style: string; label: string }> = {
                      PAID: {
                        style: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
                        label: "Lunas",
                      },
                      COMPLETED: {
                        style: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
                        label: "Selesai",
                      },
                      BOOKED: {
                        style: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50",
                        label: "Booking",
                      },
                      DRAFT: {
                        style: "bg-sky-50 text-sky-600 ring-1 ring-sky-200/50",
                        label: "Draft",
                      },
                      LIMITED_ACCESS: {
                        style: "bg-purple-50 text-purple-600 ring-1 ring-purple-200/50",
                        label: "Akses Terbatas",
                      },
                      CANCELLED_BY_BUYER: {
                        style: "bg-red-50 text-red-600 ring-1 ring-red-200/50",
                        label: "Batal (Buyer)",
                      },
                      CANCELLED_BY_SELLER: {
                        style: "bg-red-50 text-red-600 ring-1 ring-red-200/50",
                        label: "Batal (Seller)",
                      },
                      REFUND_PARTIAL: {
                        style: "bg-orange-50 text-orange-600 ring-1 ring-orange-200/50",
                        label: "Refund Sebagian",
                      },
                      REFUND_FULL: {
                        style: "bg-orange-50 text-orange-600 ring-1 ring-orange-200/50",
                        label: "Refund Penuh",
                      },
                      PROBLEM: {
                        style: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50",
                        label: "Bermasalah",
                      },
                    };
                    const config = statusConfig[deal.status] || {
                      style: "bg-muted text-muted-foreground ring-1 ring-border/50",
                      label: deal.status,
                    };
                    return (
                      <span
                        className={`inline-flex items-center rounded-[10px] px-2.5 py-1 text-xs font-medium ${config.style}`}
                      >
                        {config.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <Link
                    href={`/dashboard/deals/${deal.id}`}
                    className="rounded-[10px] bg-blue-50 px-3 py-1.5 text-blue-600 transition-colors hover:text-blue-900"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
