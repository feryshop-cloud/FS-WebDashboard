"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { transferFunds } from "@/actions/accounts";
import { formatRupiah } from "@/lib/utils";
import { X, Loader2, ArrowRightLeft } from "lucide-react";
import { Account } from "@/types/database";

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
}

export function TransferFundsModal({ isOpen, onClose, accounts }: TransferFundsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [amount, setAmount] = useState(0);
  const [adminFee, setAdminFee] = useState(0);

  const selectedSource = accounts.find((a) => a.id === sourceId);
  const sourceBalance = selectedSource?.balance || 0;
  const totalDeduction = amount + adminFee;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSourceId("");
      setDestId("");
      setAmount(0);
      setAdminFee(0);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!sourceId || !destId) {
      setErrorMsg("Harap pilih rekening asal dan tujuan.");
      return;
    }

    if (sourceId === destId) {
      setErrorMsg("Rekening asal dan tujuan tidak boleh sama.");
      return;
    }

    if (amount <= 0) {
      setErrorMsg("Nominal transfer harus lebih besar dari Rp 0.");
      return;
    }

    if (adminFee < 0) {
      setErrorMsg("Biaya admin tidak boleh kurang dari Rp 0.");
      return;
    }

    if (sourceBalance < totalDeduction) {
      setErrorMsg(
        `Saldo rekening asal tidak mencukupi. (Saldo: ${formatRupiah(sourceBalance)}, Dibutuhkan: ${formatRupiah(totalDeduction)})`,
      );
      return;
    }

    startTransition(async () => {
      const { error } = await transferFunds(sourceId, destId, amount, adminFee);
      if (error) {
        setErrorMsg(error);
      } else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Modal */}
      <div className="animate-in fade-in zoom-in-95 relative flex w-full max-w-lg flex-col overflow-hidden rounded-[10px] bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            <h2 className="text-lg font-bold">Mutasi Saldo (Transfer Internal)</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-[10px] p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
            {errorMsg && (
              <div className="flex items-start rounded-[10px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                <span className="mr-2">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Source Account */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Rekening Asal <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Rekening Asal --</option>
                {accounts
                  .filter((acc) => acc.is_active)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatRupiah(acc.balance)})
                    </option>
                  ))}
              </select>
              {selectedSource && (
                <div className="flex justify-between px-1 text-xs text-gray-500">
                  <span>Saldo Tersedia:</span>
                  <span className="font-semibold text-gray-700">{formatRupiah(sourceBalance)}</span>
                </div>
              )}
            </div>

            {/* Destination Account */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Rekening Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Rekening Tujuan --</option>
                {accounts
                  .filter((acc) => acc.is_active && acc.id !== sourceId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatRupiah(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>

            {/* Transfer Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Nominal Transfer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <span className="text-xs font-semibold text-gray-500">Rp</span>
                  </div>
                  <input
                    required
                    type="number"
                    min="1"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-[10px] border border-gray-300 py-2.5 pr-3.5 pl-10 font-mono text-sm font-bold text-gray-900 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Admin Fee */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Biaya Admin (Jika Ada)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <span className="text-xs font-semibold text-gray-500">Rp</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={adminFee || ""}
                    onChange={(e) => setAdminFee(Number(e.target.value))}
                    className="w-full rounded-[10px] border border-gray-300 py-2.5 pr-3.5 pl-10 font-mono text-sm text-gray-900 transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Calculation Breakdown Panel */}
            {(amount > 0 || adminFee > 0) && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-2.5 rounded-[10px] border border-gray-200 bg-gray-50 p-4 duration-150">
                <h4 className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Rincian Pengurangan Saldo
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Nominal Mutasi</span>
                    <span className="font-mono">{formatRupiah(amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Admin</span>
                    <span className="font-mono">{formatRupiah(adminFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-950">
                    <span>Total Potongan</span>
                    <span className="font-mono text-indigo-700">
                      {formatRupiah(totalDeduction)}
                    </span>
                  </div>
                </div>
                {sourceBalance < totalDeduction && (
                  <p className="mt-1 text-xs font-medium text-red-600">⚠️ Saldo tidak mencukupi!</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 rounded-[10px] border-t border-gray-100 bg-gray-50 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-[10px] border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || sourceBalance < totalDeduction || amount <= 0}
              className="flex items-center gap-2 rounded-[10px] bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Memproses Transfer..." : "Kirim Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
