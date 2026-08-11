import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";
import {
  getTotalBalance,
  getInventoryStats,
  getFinancialSummary,
  getRecentLedger,
  getRevenueProfitTrend,
} from "@/actions/analytics";
import { formatRupiah, formatDate } from "@/lib/utils";
import { RevenueProfitChart } from "@/components/features/RevenueProfitChart";

export default async function DashboardOverview() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [balanceRes, inventoryRes, financialRes, ledgerRes, trendRes] = await Promise.all([
    getTotalBalance(),
    getInventoryStats(),
    getFinancialSummary(),
    getRecentLedger(7),
    getRevenueProfitTrend(30),
  ]);

  const totalBalance = balanceRes.data || 0;
  const inventory = inventoryRes.data || { available: 0, sold: 0, booked: 0, other: 0, total: 0 };
  const financials = financialRes.data || { omzet: 0, profit: 0, piutang: 0 };
  const recentLedger = ledgerRes.data || [];

  const totalInv = inventory.total || 0;
  const degAvailable = totalInv > 0 ? (inventory.available / totalInv) * 360 : 0;
  const degBooked = degAvailable + (totalInv > 0 ? (inventory.booked / totalInv) * 360 : 0);
  const degSold = degBooked + (totalInv > 0 ? (inventory.sold / totalInv) * 360 : 0);

  const inventoryDonutGradient =
    totalInv > 0
      ? `conic-gradient(#3b82f6 0deg ${degAvailable}deg, #f97316 ${degAvailable}deg ${degBooked}deg, #10b981 ${degBooked}deg ${degSold}deg, #f43f5e ${degSold}deg 360deg)`
      : `conic-gradient(var(--border) 0deg 360deg)`;

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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-base font-bold">Tren Pendapatan & Profit</h2>
              <div className="mt-1 flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span> Pendapatan
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Profit Bersih
                </span>
              </div>
            </div>
            <span className="border-border-soft bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
              30 Hari Terakhir
            </span>
          </div>
          <div className="flex-1 overflow-hidden pt-2">
            <RevenueProfitChart data={trendRes.data || []} />
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
            {/* Dynamic Proportional Donut Chart */}
            <div className="mb-6 flex flex-1 items-center justify-center">
              <div
                className="relative flex h-32 w-32 items-center justify-center rounded-full p-3 shadow-sm transition-all"
                style={{ background: inventoryDonutGradient }}
              >
                <div className="bg-card flex h-24 w-24 flex-col items-center justify-center rounded-full shadow-inner">
                  <span className="text-foreground text-xl font-bold tracking-tight">
                    {inventory.total}
                  </span>
                  <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                    Stok
                  </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold">{inventory.available}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({totalInv > 0 ? Math.round((inventory.available / totalInv) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-muted-foreground font-medium">Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold">{inventory.booked}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({totalInv > 0 ? Math.round((inventory.booked / totalInv) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-muted-foreground font-medium">Terjual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold">{inventory.sold}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({totalInv > 0 ? Math.round((inventory.sold / totalInv) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <span className="text-muted-foreground font-medium">Bermasalah</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold">{inventory.other}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ({totalInv > 0 ? Math.round((inventory.other / totalInv) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION (Aktivitas Keuangan Terbaru) */}
      <div className="border-border-soft bg-card flex flex-col rounded-xl border p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-base font-bold">Aktivitas Keuangan Terbaru</h2>
          <Link
            href="/dashboard/ledger"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50/50 hover:text-blue-700"
          >
            Lihat Semua Transaksi &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {recentLedger.length > 0 ? (
            recentLedger.map((rawTx: Record<string, unknown>, idx: number) => {
              const tx = rawTx as {
                id?: string | null;
                amount?: number | null;
                transaction_type?: string | null;
                description?: string | null;
                reference_type?: string | null;
                reference_id?: string | null;
                account_id?: string | null;
                accounts?: { name?: string | null } | null;
                created_at?: string | null;
              };
              const isPositive = Number(tx.amount ?? 0) > 0;

              let href = "/dashboard/ledger";
              if (tx.account_id) {
                href = `/dashboard/ledger?accountId=${tx.account_id}`;
              } else if (tx.reference_type === "DEAL") {
                href = "/dashboard/deals";
              } else if (
                tx.reference_type === "STOCK_PURCHASE" ||
                tx.transaction_type === "STOCK_PURCHASE"
              ) {
                href = "/dashboard/purchases";
              } else if (tx.reference_type === "TOPUP_ORDER") {
                href = "/dashboard/topup-orders";
              }

              return (
                <Link
                  key={tx.id || idx}
                  href={href}
                  className="border-border-soft hover:bg-muted/40 group flex items-center justify-between rounded-xl border p-3.5 transition-all hover:border-blue-500/40 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/80"
                          : "bg-rose-50 text-rose-600 group-hover:bg-rose-100/80"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground truncate text-sm font-bold transition-colors group-hover:text-blue-600">
                          {(tx.transaction_type ?? "").replace(/_/g, " ")}
                        </p>
                        {tx.description && (
                          <span
                            className="text-muted-foreground max-w-50 truncate text-xs font-normal"
                            title={tx.description}
                          >
                            • {tx.description}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {tx.accounts?.name || "Akun Kas"} • {formatDate(tx.created_at ?? "")}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div
                      className={`font-mono text-sm font-bold tracking-tight sm:text-base ${
                        isPositive ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatRupiah(Number(tx.amount ?? 0))}
                    </div>
                    <ChevronRight className="text-faint-foreground group-hover:text-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
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
