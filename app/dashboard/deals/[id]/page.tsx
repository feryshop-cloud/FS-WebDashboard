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
    <div className="mx-auto min-h-screen max-w-[1400px] space-y-6 bg-gray-50/50 p-6 md:p-8">
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
          <div className="rounded-[10px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">
              Deal Overview
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Deal Number</p>
                <p className="mt-1 font-mono text-base font-semibold text-gray-900">
                  {deal.deal_number}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={deal.status} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{deal.customer_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {deal.customer_contact || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Stock Linked</span>
                <span className="text-sm font-semibold text-gray-900">
                  {deal.stock?.name} ({deal.stock?.category})
                </span>
              </div>
            </div>
          </div>

          {/* Historical Payments Table */}
          <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Method/Account
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {deal.payments && deal.payments.length > 0 ? (
                    deal.payments.map((payment: PaymentWithRelations) => (
                      <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                          {payment.account?.name || "Unknown Account"}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-bold whitespace-nowrap text-emerald-600">
                          + {formatRupiah(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          {payment.notes || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          <span className="inline-flex items-center rounded-[10px] bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200/50">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
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
          <div className="sticky top-6 rounded-[10px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">
              Financial Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Deal Price</span>
                <span className="font-mono font-medium text-gray-900">
                  {formatRupiah(deal.deal_price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Paid</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatRupiah(deal.total_paid)}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Remaining Balance</span>
                  <span
                    className={`font-mono text-lg font-bold ${deal.remaining_balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {formatRupiah(deal.remaining_balance)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Payment Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {deal.payment_percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[10px] bg-gray-100">
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
