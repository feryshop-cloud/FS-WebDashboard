import { getDealById } from "@/actions/deals";
import { getAccounts } from "@/actions/accounts";
import { DealDetailHeader } from "./DealDetailHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
    <div className="mx-auto min-h-screen max-w-[1400px] space-y-6 bg-muted/50 p-6 md:p-8">
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
          <div className="rounded-[10px] border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 border-b border-border-soft pb-4 text-lg font-bold text-foreground">
              Deal Overview
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deal Number</p>
                <p className="mt-1 font-mono text-base font-semibold text-foreground">
                  {deal.deal_number}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={deal.status} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="mt-1 text-base font-semibold text-foreground">{deal.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {deal.customer_contact || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-border-soft bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Stock Linked</span>
                <span className="text-sm font-semibold text-foreground">
                  {deal.stock?.name} ({deal.stock?.category})
                </span>
              </div>
            </div>
          </div>

          {/* Historical Payments Table */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
            <div className="border-b border-border-soft px-6 py-5">
              <h2 className="text-lg font-bold text-foreground">Payment History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Method/Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {deal.payments && deal.payments.length > 0 ? (
                    deal.payments.map((payment: PaymentWithRelations) => (
                      <tr key={payment.id} className="transition-colors hover:bg-muted">
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                          {payment.account?.name || "Unknown Account"}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-bold whitespace-nowrap text-emerald-600">
                          + {formatRupiah(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                          {payment.notes || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                          <span className="inline-flex items-center rounded-[10px] bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200/50">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
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
          <div className="sticky top-6 rounded-[10px] border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 border-b border-border-soft pb-4 text-lg font-bold text-foreground">
              Financial Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deal Price</span>
                <span className="font-mono font-medium text-foreground">
                  {formatRupiah(deal.deal_price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatRupiah(deal.total_paid)}
                </span>
              </div>

              <div className="border-t border-border-soft pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Remaining Balance</span>
                  <span
                    className={`font-mono text-lg font-bold ${deal.remaining_balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {formatRupiah(deal.remaining_balance)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-border-soft pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Payment Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {deal.payment_percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[10px] bg-muted">
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
