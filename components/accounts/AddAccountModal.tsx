"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/actions/accounts";
import { X, Loader2, CreditCard } from "lucide-react";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);

    const name = formData.get("name") as string;
    const accountNumber = formData.get("account_number") as string;
    const balance = Number(formData.get("balance") || 0);

    if (!name.trim()) {
      setErrorMsg("Nama rekening wajib diisi.");
      return;
    }

    startTransition(async () => {
      const { error } = await createAccount({
        name,
        account_number: accountNumber || null,
        balance,
        is_active: true,
      });

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
      <div className="animate-in fade-in zoom-in-95 bg-card relative flex w-full max-w-lg flex-col overflow-hidden rounded-[10px] shadow-2xl duration-200">
        <div className="border-border-soft flex items-center justify-between border-b bg-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-lg font-bold">Tambah Rekening Baru</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="hover:bg-card/10 rounded-[10px] p-1.5 text-white/80 transition-colors hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-5 flex items-start rounded-[10px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              <span className="mr-2">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="add-account-form" action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-semibold">
                Nama Rekening/Metode <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="name"
                type="text"
                className="border-input placeholder:text-faint-foreground w-full rounded-[10px] border px-4 py-2.5 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Bank Mandiri Fery"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-semibold">
                Nomor Rekening / No. HP (Optional)
              </label>
              <input
                name="account_number"
                type="text"
                className="border-input placeholder:text-faint-foreground w-full rounded-[10px] border px-4 py-2.5 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1420017110600 or 0812345678"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-semibold">Saldo Awal (Rp)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-muted-foreground text-sm font-medium">Rp</span>
                </div>
                <input
                  name="balance"
                  type="number"
                  defaultValue="0"
                  min="0"
                  className="border-input w-full rounded-[10px] border py-2.5 pr-4 pl-12 font-mono text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="border-border-soft bg-muted flex justify-end gap-3 rounded-[10px] border-t p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="border-input bg-card text-foreground hover:bg-muted rounded-[10px] border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="add-account-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-[10px] bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Menyimpan..." : "Tambah Rekening"}
          </button>
        </div>
      </div>
    </div>
  );
}
