"use client";

import { useState, useTransition } from "react";
import { AddPaymentModal } from "@/components/deals/AddPaymentModal";
import { Plus, ArrowLeft, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Account, DealStatus } from "@/types/database";
import { cancelDeal } from "@/actions/deals";

interface DealDetailHeaderProps {
  dealId: string;
  stockId: string;
  status: DealStatus;
  remainingBalance: number;
  accounts: Account[];
}

export function DealDetailHeader({
  dealId,
  stockId,
  status,
  remainingBalance,
  accounts,
}: DealDetailHeaderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isCancellable =
    remainingBalance > 0 &&
    status !== "CANCELLED_BY_BUYER" &&
    status !== "CANCELLED_BY_SELLER" &&
    status !== "COMPLETED" &&
    status !== "PROBLEM";

  const handleCancelDeal = () => {
    setCancelError(null);
    startTransition(async () => {
      const { success, error } = await cancelDeal(dealId, stockId);
      if (!success) {
        setCancelError(error || "Gagal membatalkan transaksi.");
      } else {
        setIsCancelModalOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/deals"
            className="rounded-[10px] border border-border bg-card p-2 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Deal Details</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View history and manage payments for this deal.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          {isCancellable && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-card px-4 py-2.5 font-semibold text-red-600 transition-all hover:bg-red-50 sm:w-auto"
            >
              <XCircle className="h-5 w-5" />
              Batalkan Transaksi
            </button>
          )}

          {remainingBalance > 0 &&
            status !== "CANCELLED_BY_BUYER" &&
            status !== "CANCELLED_BY_SELLER" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200 active:bg-emerald-800 sm:w-auto"
              >
                <Plus className="h-5 w-5" />
                Input Next Payment
              </button>
            )}
        </div>
      </div>

      <AddPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dealId={dealId}
        remainingBalance={remainingBalance}
        accounts={accounts}
      />

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={!isPending ? () => setIsCancelModalOpen(false) : undefined}
          />
          <div className="animate-in fade-in zoom-in-95 relative flex w-full max-w-md flex-col overflow-hidden rounded-[10px] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-red-600">
              <div className="rounded-[10px] bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Batalkan Transaksi?</h2>
            </div>

            <p className="mb-6 text-sm text-muted-foreground">
              Anda yakin ingin membatalkan deal ini? Status deal akan menjadi <strong>Batal</strong>{" "}
              dan stok akun akan dikembalikan ke status <strong>Tersedia</strong> di inventori.
            </p>

            {cancelError && (
              <div className="mb-6 rounded-[10px] border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
                ⚠️ {cancelError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelError(null);
                }}
                disabled={isPending}
                className="rounded-[10px] border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelDeal}
                disabled={isPending}
                className="flex items-center gap-2 rounded-[10px] bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-70"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Membatalkan..." : "Ya, Batalkan Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
