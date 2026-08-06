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
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Ringkasan performa bisnis dan keuangan operasional.
        </p>
      </div>

      {/* 1. TOP METRICS (4 Columns) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* OMZET */}
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Omzet
            </span>
            <TrendingUp className="text-faint-foreground h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(financials.omzet)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +8.2%
              </span>
              <span className="text-faint-foreground ml-2">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* LABA BERSIH */}
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Laba Bersih
            </span>
            <Activity className="text-faint-foreground h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(financials.profit)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +5.4%
              </span>
              <span className="text-faint-foreground ml-2">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* KAS & BANK AKTIF */}
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Kas & Bank Aktif
            </span>
            <Wallet className="text-faint-foreground h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(totalBalance)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-emerald-600">
                <ArrowUpRight className="mr-0.5 h-3 w-3" /> +12.5%
              </span>
              <span className="text-faint-foreground ml-2">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* PIUTANG */}
        <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Piutang
            </span>
            <CreditCard className="text-faint-foreground h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-bold tracking-tight">
              {formatRupiah(financials.piutang)}
            </h3>
            <div className="mt-2 flex items-center text-xs">
              <span className="flex items-center font-medium text-orange-500">
                <ArrowDownRight className="mr-0.5 h-3 w-3" /> -2.1%
              </span>
              <span className="text-faint-foreground ml-2">vs bulan lalu</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN VISUALIZATION (2-Column Grid) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Tren Pendapatan & Profit (Span 2/3) */}
        <div className="border-border-soft bg-card flex h-90 flex-col rounded-xl border p-6 shadow-sm md:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-foreground text-base font-bold">Tren Pendapatan & Profit</h2>
            <span className="border-border-soft bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
              30 Hari Terakhir
            </span>
          </div>
          <div className="border-border bg-muted/50 flex flex-1 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <LineChart className="text-faint-foreground mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm font-medium">Area Chart Placeholder</p>
              <p className="text-faint-foreground mt-1 text-xs">Mockup grafik Revenue vs Profit</p>
            </div>
          </div>
        </div>

        {/* Status Inventori (Span 1/3) */}
        <div className="border-border-soft bg-card flex h-90 flex-col rounded-xl border p-6 shadow-sm md:col-span-1">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-foreground text-base font-bold">Status Inventori</h2>
            <span className="border-border-soft bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
              Total: {inventory.total}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between">
            {/* Donut Chart Placeholder */}
            <div className="mb-6 flex flex-1 items-center justify-center">
              <div className="border-border-soft relative flex h-32 w-32 items-center justify-center rounded-full border-12 border-t-emerald-500 border-r-blue-500 border-b-orange-500 border-l-rose-500">
                <div className="text-center">
                  <span className="text-foreground block text-xl font-bold">{inventory.total}</span>
                  <span className="text-muted-foreground block text-[10px] font-medium">Stok</span>
                </div>
              </div>
            </div>

            {/* Legend / List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground font-medium">Tersedia</span>
                </div>
                <span className="text-foreground font-bold">{inventory.available}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-muted-foreground font-medium">Booking</span>
                </div>
                <span className="text-foreground font-bold">{inventory.booked}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-muted-foreground font-medium">Terjual</span>
                </div>
                <span className="text-foreground font-bold">{inventory.sold}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <span className="text-muted-foreground font-medium">Bermasalah</span>
                </div>
                <span className="text-foreground font-bold">{inventory.other}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION (Aktivitas Keuangan Terbaru) */}
      <div className="border-border-soft bg-card flex flex-col rounded-xl border p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-base font-bold">Aktivitas Keuangan Terbaru</h2>
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
                  className="group border-border-soft hover:border-border flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold transition-colors group-hover:text-blue-600">
                        {(tx.transaction_type ?? "").replace(/_/g, " ")}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {tx.accounts?.name || "Unknown Account"} • {formatDate(tx.created_at ?? "")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-base font-bold tracking-tight ${isPositive ? "text-emerald-600" : "text-foreground"}`}
                  >
                    {isPositive ? "+" : ""}
                    {formatRupiah(Number(tx.amount ?? 0))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border-border bg-muted text-faint-foreground rounded-lg border border-dashed py-10 text-center text-sm">
              Belum ada aktivitas keuangan terbaru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
