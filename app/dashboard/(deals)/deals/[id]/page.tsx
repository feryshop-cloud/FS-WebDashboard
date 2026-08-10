import { getDealById } from "@/actions/deals";
import { getAccounts } from "@/actions/accounts";
import { DealDetailHeader } from "./DealDetailHeader";
import { DealStatusBadge } from "@/components/ui/StatusBadge";
import { PaymentWithRelations, DealStatus } from "@/types/database";
import { formatRupiah, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: deal, error: dealError }, { data: accounts }] = await Promise.all([
    getDealById(id),
    getAccounts(),
  ]);

  if (dealError || !deal) {
    return (
      <div className="p-6">
        <div className="rounded-[10px] border border-red-100 bg-red-50 p-4 text-red-600 shadow-sm">
          Failed to load deal details: {dealError || "Not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 mx-auto min-h-screen max-w-[1400px] space-y-6 p-6 md:p-8">
      <DealDetailHeader
        dealId={deal.id}
        stockId={deal.stock_id}
        status={deal.status as DealStatus}
        remainingBalance={deal.remaining_balance}
        accounts={accounts || []}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Deal Summary Card */}
        <div className="space-y-6 lg:col-span-2">
          <div className="border-border bg-card rounded-[10px] border p-6 shadow-sm">
            <h2 className="border-border-soft text-foreground mb-6 border-b pb-4 text-lg font-bold">
              Deal Overview
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Deal Number</p>
                <p className="text-foreground mt-1 font-mono text-base font-semibold">
                  {deal.deal_number}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Status</p>
                <div className="mt-1">
                  <DealStatusBadge status={deal.status} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Customer</p>
                <p className="text-foreground mt-1 text-base font-semibold">{deal.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Contact</p>
                <p className="text-foreground mt-1 text-base font-semibold">
                  {deal.customer_contact || "-"}
                </p>
              </div>
            </div>

            <div className="border-border-soft bg-muted rounded-[10px] border p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">Stock Linked</span>
                <span className="text-foreground text-sm font-semibold">
                  {deal.stock?.name} ({deal.stock?.category})
                </span>
              </div>
            </div>
          </div>

          {/* Historical Payments Table */}
          <div className="border-border bg-card overflow-hidden rounded-[10px] border shadow-sm">
            <div className="border-border-soft border-b px-6 py-5">
              <h2 className="text-foreground text-lg font-bold">Payment History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="divide-border min-w-full divide-y">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase">
                      Date
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase">
                      Method/Account
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase">
                      Amount
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase">
                      Notes
                    </th>
                    <th className="text-muted-foreground px-6 py-4 text-left text-xs font-semibold uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border bg-card divide-y">
                  {deal.payments && deal.payments.length > 0 ? (
                    deal.payments.map((payment: PaymentWithRelations) => (
                      <tr key={payment.id} className="hover:bg-muted transition-colors">
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="text-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
                          {payment.account?.name || "Unknown Account"}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-bold whitespace-nowrap text-emerald-600">
                          + {formatRupiah(payment.amount)}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          {payment.notes || "-"}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center rounded-[10px] bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200/50">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-muted-foreground px-6 py-12 text-center text-sm"
                      >
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Summary Sidebar */}
        <div className="space-y-6">
          <div className="border-border bg-card sticky top-6 rounded-[10px] border p-6 shadow-sm">
            <h2 className="border-border-soft text-foreground mb-6 border-b pb-4 text-lg font-bold">
              Financial Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Deal Price</span>
                <span className="text-foreground font-mono font-medium">
                  {formatRupiah(deal.deal_price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total Paid</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatRupiah(deal.total_paid)}
                </span>
              </div>

              <div className="border-border-soft border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Remaining Balance</span>
                  <span
                    className={`font-mono text-lg font-bold ${deal.remaining_balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {formatRupiah(deal.remaining_balance)}
                  </span>
                </div>
              </div>

              <div className="border-border-soft mt-6 border-t pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Payment Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {deal.payment_percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="bg-muted h-2.5 w-full overflow-hidden rounded-[10px]">
                  <div
                    className={`h-full rounded-[10px] transition-all duration-1000 ease-out ${deal.payment_percentage >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                    style={{ width: `${Math.min(deal.payment_percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
