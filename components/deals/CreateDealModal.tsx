"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/actions/deals";
import { getAvailableStocks } from "@/actions/stocks";
import { X, Loader2, FileText } from "lucide-react";
import { Stock } from "@/types/database";
import { formatRupiah } from "@/lib/utils";

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDealModal({ isOpen, onClose }: CreateDealModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  async function loadStocks() {
    setIsLoadingStocks(true);
    const { data, error } = await getAvailableStocks();
    if (!error && data) {
      setStocks(data);
    }
    setIsLoadingStocks(false);
  }

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadStocks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);

    const stockId = formData.get("stock_id") as string;
    const customerName = formData.get("customer_name") as string;
    const customerContact = formData.get("customer_contact") as string;
    const dealPrice = Number(formData.get("deal_price") || 0);

    if (!stockId) {
      setErrorMsg("Pilih stok terlebih dahulu.");
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg("Nama customer wajib diisi.");
      return;
    }
    if (dealPrice <= 0) {
      setErrorMsg("Harga deal harus lebih besar dari 0.");
      return;
    }

    startTransition(async () => {
      const { data, error } = await createDeal(
        stockId,
        customerName,
        customerContact || "",
        dealPrice,
      );

      if (error || !data) {
        setErrorMsg(error || "Gagal membuat deal");
      } else {
        onClose();
        router.push(`/dashboard/deals/${data.id}`);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Drawer */}
      <div className="animate-in slide-in-from-right relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl duration-300">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-slate-50 px-6 py-4 text-slate-900">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-bold">Buat Transaksi Baru (Deal)</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-[10px] p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-5 flex items-start rounded-[10px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              <span className="mr-2">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="create-deal-form" action={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Pilih Stok (Hanya Tersedia) <span className="text-red-500">*</span>
              </label>
              {isLoadingStocks ? (
                <div className="flex w-full items-center gap-2 rounded-[10px] border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat stok...
                </div>
              ) : (
                <select
                  required
                  name="stock_id"
                  className="w-full rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Pilih Stok --
                  </option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name || stock.category} • Modal: {formatRupiah(stock.capital_price)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Nama Customer <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="customer_name"
                type="text"
                className="w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. Budi Santoso"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Kontak Customer (Optional)
              </label>
              <input
                name="customer_contact"
                type="text"
                className="w-full rounded-[10px] border border-gray-300 px-4 py-2.5 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. 08123456789 / @budi_ig"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Harga Deal (Harga Jual Akhir) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-sm font-medium text-gray-500">Rp</span>
                </div>
                <input
                  required
                  name="deal_price"
                  type="number"
                  min="1"
                  className="w-full rounded-[10px] border border-gray-300 py-2.5 pr-4 pl-12 font-mono text-sm transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500">Harga final yang disepakati dengan customer.</p>
            </div>
          </form>
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
            form="create-deal-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-[10px] bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-purple-200 transition-all hover:bg-purple-700 active:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Menyimpan..." : "Buat Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
