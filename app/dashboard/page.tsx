import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
} from "lucide-react";
import {
  getTotalBalance,
  getInventoryStats,
  getFinancialSummary,
  getRecentLedger,
} from "@/actions/analytics";
import { formatRupiah, formatDate } from "@/lib/utils";

export default async function DashboardOverview() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [balanceRes, inventoryRes, financialRes, ledgerRes] = await Promise.all([
    getTotalBalance(),
    getInventoryStats(),
    getFinancialSummary(),
    getRecentLedger(7),
  ]);

  const totalBalance = balanceRes.data || 0;
  const inventory = inventoryRes.data || { available: 0, sold: 0, booked: 0, other: 0, total: 0 };
  const financials = financialRes.data || { omzet: 0, profit: 0, piutang: 0 };
  const recentLedger = ledgerRes.data || [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Command Center</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Ringkasan performa bisnis dan keuangan operasional.
        </p>
      </div>

      {/* 1. TOP METRICS (4 Columns) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* OMZET */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Omzet</span>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">
              {formatRupiah(financials.omzet)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +8.2%
              </span>
              <span className="ml-2 text-slate-400">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* LABA BERSIH */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Laba Bersih
            </span>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">
              {formatRupiah(financials.profit)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +5.4%
              </span>
              <span className="ml-2 text-slate-400">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* KAS & BANK AKTIF */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Kas & Bank Aktif
            </span>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">
              {formatRupiah(totalBalance)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +12.5%
              </span>
              <span className="ml-2 text-slate-400">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* PIUTANG */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Piutang
            </span>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800">
              {formatRupiah(financials.piutang)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-orange-500">
                <ArrowDownRight className="mr-0.5 h-3 w-3" /> -2.1%
              </span>
              <span className="ml-2 text-slate-400">vs bulan lalu</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN VISUALIZATION (2-Column Grid) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Tren Pendapatan & Profit (Span 2/3) */}
        <div className="flex h-[360px] flex-col rounded-xl border border-slate-100 bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Tren Pendapatan & Profit</h2>
            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              30 Hari Terakhir
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
            <div className="text-center">
              <LineChart className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Area Chart Placeholder</p>
              <p className="mt-1 text-xs text-slate-400">Mockup grafik Revenue vs Profit</p>
            </div>
          </div>
        </div>

        {/* Status Inventori (Span 1/3) */}
        <div className="flex h-[360px] flex-col rounded-xl border border-slate-100 bg-white p-6 shadow-sm md:col-span-1">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Status Inventori</h2>
            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              Total: {inventory.total}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between">
            {/* Donut Chart Placeholder */}
            <div className="mb-6 flex flex-1 items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-slate-100 border-t-emerald-500 border-r-blue-500 border-b-orange-500 border-l-rose-500">
                <div className="text-center">
                  <span className="block text-xl font-bold text-slate-800">{inventory.total}</span>
                  <span className="block text-[10px] font-medium text-slate-500">Stok</span>
                </div>
              </div>
            </div>

            {/* Legend / List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-slate-600">Tersedia</span>
                </div>
                <span className="font-bold text-slate-800">{inventory.available}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="font-medium text-slate-600">Booking</span>
                </div>
                <span className="font-bold text-slate-800">{inventory.booked}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium text-slate-600">Terjual</span>
                </div>
                <span className="font-bold text-slate-800">{inventory.sold}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <span className="font-medium text-slate-600">Bermasalah</span>
                </div>
                <span className="font-bold text-slate-800">{inventory.other}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION (Aktivitas Keuangan Terbaru) */}
      <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Aktivitas Keuangan Terbaru</h2>
          <span className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50">
            Lihat Semua Transaksi
          </span>
        </div>

        <div className="space-y-3">
          {recentLedger.length > 0 ? (
            recentLedger.map((rawTx: Record<string, unknown>) => {
              const tx = rawTx as {
                id?: string | null;
                amount?: number | null;
                transaction_type?: string | null;
                accounts?: { name?: string | null } | null;
                created_at?: string | null;
              };
              const isPositive = Number(tx.amount ?? 0) > 0;
              return (
                <div
                  key={tx.id ?? undefined}
                  className="group flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"}`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-600">
                        {(tx.transaction_type ?? "").replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {tx.accounts?.name || "Unknown Account"} • {formatDate(tx.created_at ?? "")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-base font-bold tracking-tight ${isPositive ? "text-emerald-600" : "text-slate-800"}`}
                  >
                    {isPositive ? "+" : ""}
                    {formatRupiah(Number(tx.amount ?? 0))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-400">
              Belum ada aktivitas keuangan terbaru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
