"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  MoreHorizontal,
  Download,
  X,
  Loader2,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getTradeInDeals, createTukarTambah } from "@/app/actions/trade-in";
import { getInventory } from "@/app/actions/inventory";
import { getAccounts } from "@/app/actions/accounts";
import type { Database } from "@/types/database.types";
import { TradeInWithRelations } from "@/types/database";

type Deal = TradeInWithRelations;
type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"] & {
  games: { name: string; slug: string } | null;
};
type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function TradeInPage() {
  const [isAddTTOpen, setIsAddTTOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stocks, setStocks] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states for dynamic cash calc
  const [priceOut, setPriceOut] = useState(0);
  const [ttValue, setTtValue] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dealsData, stocksResult, accountsData] = await Promise.all([
        getTradeInDeals(),
        getInventory(),
        getAccounts(),
      ]);
      setDeals((dealsData as unknown as TradeInWithRelations[]) || []);
      setStocks((stocksResult.data || []).filter((s) => s.status === "AVAILABLE"));
      setAccounts(accountsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAddTT = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createTukarTambah(formData);
      setIsAddTTOpen(false);
      loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selisih = ttValue - priceOut;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Tukar Tambah (Trade-In)
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola transaksi pertukaran aset (akun customer) dengan stok Feryshop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="border-border bg-card text-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={() => setIsAddTTOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Transaksi TT
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-border-soft bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="text-faint-foreground h-4 w-4" />
          </div>
          <input
            type="text"
            className="border-border bg-muted text-foreground block w-full rounded-lg border py-2 pr-3 pl-10 placeholder-slate-400 transition-all outline-none focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Cari ID transaksi, nama customer..."
          />
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button className="border-border bg-card text-foreground hover:bg-muted inline-flex w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="text-faint-foreground h-4 w-4" />
              <span>Filter Status</span>
            </div>
          </button>
        </div>
      </div>

      {/* Cards/Table View for Complex TT Relationships */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="border-border-soft bg-card flex justify-center rounded-xl border p-12 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : deals.length === 0 ? (
          <div className="border-border-soft bg-card text-muted-foreground rounded-xl border p-12 text-center text-sm shadow-sm">
            Belum ada transaksi Tukar Tambah.
          </div>
        ) : (
          deals.map((tt) => {
            let badgeClass = "bg-muted text-muted-foreground border-border";
            if ((tt.status as string) === "Selesai" || (tt.status as string) === "Lunas")
              badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
            if ((tt.status as string) === "Booking")
              badgeClass = "bg-orange-50 text-orange-600 border-orange-100";
            if ((tt.status as string)?.includes("Cancel"))
              badgeClass = "bg-rose-50 text-rose-600 border-rose-100";

            const stockOutName = tt.deal_items?.[0]?.stocks?.name || "N/A";
            const inItems = tt.trade_in_items || [];

            return (
              <div
                key={tt.id}
                className="group border-border-soft bg-card relative overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute top-4 right-4">
                  <button className="rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Card Header */}
                <div className="border-border-soft/50 bg-muted/30 flex items-center gap-4 border-b px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-foreground text-sm font-bold">{tt.deal_number}</h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                      >
                        {tt.status as string}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                      {(tt.customers as { name?: string | null } | null)?.name || "-"} •{" "}
                      {formatDate(tt.created_at as string)}
                    </p>
                  </div>
                </div>

                {/* TT Content */}
                <div className="grid grid-cols-1 items-center gap-6 px-6 py-5 lg:grid-cols-12">
                  {/* INWARD (Customer Aset Masuk) */}
                  <div className="col-span-1 flex flex-col gap-3 lg:col-span-4">
                    <h3 className="text-faint-foreground text-[10px] font-bold tracking-wider uppercase">
                      Aset Customer (Masuk)
                    </h3>
                    <div className="space-y-2">
                      {(inItems as Array<{ description?: unknown; estimated_value?: unknown }>).map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="border-border-soft bg-muted flex items-center justify-between rounded-lg border p-2.5"
                          >
                            <span
                              className="text-foreground mr-2 truncate text-xs font-semibold"
                              title={String(item.description ?? "")}
                            >
                              {String(item.description ?? "")}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              {formatRupiah(Number(item.estimated_value ?? 0))}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* ARROW SEPARATOR */}
                  <div className="col-span-1 flex hidden justify-center lg:col-span-1 lg:flex">
                    <ArrowRightLeft className="text-faint-foreground h-6 w-6" />
                  </div>

                  {/* OUTWARD (Stok Feryshop Keluar) */}
                  <div className="col-span-1 flex flex-col gap-3 lg:col-span-4">
                    <h3 className="text-faint-foreground text-[10px] font-bold tracking-wider uppercase">
                      Stok Feryshop (Keluar)
                    </h3>
                    <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                      <span
                        className="text-foreground mr-2 truncate text-xs font-semibold"
                        title={stockOutName}
                      >
                        {stockOutName}
                      </span>
                      <span className="text-foreground text-xs font-bold">
                        {formatRupiah(Number(tt.total_deal_price))}
                      </span>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className="border-border-soft lg:border-border-soft col-span-1 mt-4 flex h-full flex-col items-end justify-center border-t pt-4 lg:col-span-3 lg:mt-0 lg:border-l lg:pt-0 lg:pl-6">
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Nilai Transaksi Feryshop
                    </span>
                    <span className="text-foreground mt-1 text-xl font-bold tracking-tight">
                      {formatRupiah(Number(tt.total_deal_price))}
                    </span>

                    <button className="mt-4 w-full rounded-md bg-blue-50 px-3 py-1.5 text-center text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 sm:w-auto">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deals.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button className="border-border bg-card text-muted-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors">
            Muat Lebih Banyak
          </button>
        </div>
      )}

      {/* Buat TT Baru Modal */}
      {isAddTTOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right bg-card flex h-full w-full max-w-md flex-col shadow-2xl duration-300">
            <div className="border-border-soft bg-muted flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-foreground text-lg font-bold">Transaksi Tukar Tambah</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi detail aset masuk dan keluar.
                </p>
              </div>
              <button
                onClick={() => setIsAddTTOpen(false)}
                className="bg-card text-faint-foreground hover:text-muted-foreground rounded-full p-2 shadow-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddTT} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                {/* Customer Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider uppercase">
                    Data Customer
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Nama Customer
                    </label>
                    <input
                      name="customer_name"
                      required
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Mis. Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      No. HP Customer (Opsional)
                    </label>
                    <input
                      name="customer_phone"
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Mis. 08123456789"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Feryshop Out Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider text-blue-600 uppercase">
                    Stok Keluar (Feryshop)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Pilih Stok
                    </label>
                    <select
                      name="stock_out_id"
                      required
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Stok Tersedia --</option>
                      {stocks.map((stock) => (
                        <option key={stock.id} value={stock.id}>
                          {stock.title_reference}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Harga Deal (Nilai Stok Keluar)
                    </label>
                    <input
                      name="price_out"
                      required
                      type="number"
                      min="1"
                      value={priceOut || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriceOut(val);
                        setPaymentAmount(Math.abs(val - ttValue));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                <div className="bg-muted h-px"></div>

                {/* Customer In Section */}
                <div className="space-y-3">
                  <h3 className="text-faint-foreground text-xs font-bold tracking-wider text-emerald-600 uppercase">
                    Aset Masuk (Dari Customer)
                  </h3>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Deskripsi Aset TT
                    </label>
                    <input
                      name="tt_desc"
                      required
                      type="text"
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Mis. Akun MLBB Mythic"
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-sm font-medium">
                      Estimasi Nilai Aset Masuk
                    </label>
                    <input
                      name="tt_value"
                      required
                      type="number"
                      min="1"
                      value={ttValue || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTtValue(val);
                        setPaymentAmount(Math.abs(priceOut - val));
                      }}
                      className="border-border w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Rp 0"
                    />
                  </div>
                </div>

                {/* Selisih & Payment Calculation */}
                {(priceOut > 0 || ttValue > 0) && (
                  <div
                    className={`rounded-xl border p-4 ${selisih < 0 ? "border-emerald-100 bg-emerald-50" : selisih > 0 ? "border-rose-100 bg-rose-50" : "border-border-soft bg-muted"}`}
                  >
                    <h3 className="text-foreground mb-2 text-sm font-semibold">
                      Selisih Transaksi
                    </h3>
                    <div className="text-muted-foreground mb-3 text-xs">
                      {selisih < 0 ? (
                        <span>
                          Customer <strong className="text-emerald-700">tambah uang</strong>{" "}
                          sebesar:
                        </span>
                      ) : selisih > 0 ? (
                        <span>
                          Feryshop <strong className="text-rose-700">bayar cashback</strong>{" "}
                          sebesar:
                        </span>
                      ) : (
                        <span>Tukar guling (tanpa tambah/cashback).</span>
                      )}
                    </div>
                    <div className="text-foreground mb-4 text-lg font-bold">
                      {formatRupiah(Math.abs(selisih))}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="hidden"
                        name="payment_direction"
                        value={selisih < 0 ? "IN" : "OUT"}
                      />
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Uang Tunai yang Dibayarkan
                        </label>
                        <input
                          name="payment_amount"
                          type="number"
                          min="0"
                          value={paymentAmount || ""}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Rp 0"
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                          Pilih Rekening Transaksi
                        </label>
                        <select
                          name="account_id"
                          required={paymentAmount > 0}
                          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">-- Rekening (Wajib jika ada tunai) --</option>
                          {accounts
                            .filter((a) => a.is_active)
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-border-soft bg-card border-t p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Proses Tukar Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
