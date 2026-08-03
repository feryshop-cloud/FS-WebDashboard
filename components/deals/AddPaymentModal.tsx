"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPayment } from "@/actions/deals";
import { X, Loader2 } from "lucide-react";
import { Account } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  remainingBalance: number;
  accounts: Account[];
}

export function AddPaymentModal({
  isOpen,
  onClose,
  dealId,
  remainingBalance,
  accounts,
}: AddPaymentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);

    const accountId = formData.get("account_id") as string;
    const amount = Number(formData.get("amount"));
    const notes = formData.get("notes") as string;

    if (!accountId || amount <= 0) {
      setErrorMsg("Please enter a valid amount and select an account.");
      return;
    }

    startTransition(async () => {
      const { error } = await addPayment(dealId, accountId, amount, notes);
      if (error) {
        setErrorMsg(error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Drawer */}
      <div className="animate-in slide-in-from-right relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl duration-300">
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Input Next Payment</h2>
            <p className="mt-1 text-xs text-gray-500">Catat pembayaran baru untuk transaksi ini.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-full bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {errorMsg && (
            <div className="flex items-start rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              <span>⚠️</span>
              <span className="ml-2">{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
            <span className="font-mono text-lg font-bold text-blue-700">
              {formatRupiah(remainingBalance)}
            </span>
          </div>

          <form id="add-payment-form" action={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Payment Amount (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="amount"
                type="number"
                min="1"
                max={remainingBalance}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm transition-all outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Select Account / Method <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="account_id"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Account --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Notes / Ref Number</label>
              <input
                name="notes"
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. TF BCA a.n. Budi"
              />
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-white p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-payment-form"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Processing..." : "Submit Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
