import { createClient } from "../../../lib/supabase/server";
import { AnalyticsCharts } from "../../../components/features/AnalyticsCharts";
import { TrendingUp, Award, Coins, Activity } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch only sold items for analytics
  const { data: soldItems, error } = await supabase
    .from("inventory")
    .select(
      `
      sold_price,
      capital_price,
      sold_at,
      games (
        name
      )
    `,
    )
    .eq("status", "SOLD")
    .order("sold_at", { ascending: true });

  // Processing Data
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalSales = 0;

  const gameSalesMap: Record<string, number> = {};
  const dateSalesMap: Record<string, { revenue: number; profit: number }> = {};

  if (soldItems) {
    soldItems.forEach((rawItem: Record<string, unknown>) => {
      const item = rawItem as {
        sold_price?: number | null;
        capital_price?: number | null;
        games?: { name?: string | null } | null;
        sold_at?: string | null;
      };
      const rev = Number(item.sold_price ?? 0);
      const cap = Number(item.capital_price ?? 0);
      const prof = rev - cap;

      totalRevenue += rev;
      totalProfit += prof;
      totalSales++;

      // Game Stats
      const gameName = item.games?.name || "Unknown";
      gameSalesMap[gameName] = (gameSalesMap[gameName] || 0) + 1;

      // Timeline Stats (group by date)
      if (item.sold_at) {
        const dateStr = formatDate(item.sold_at, false);

        if (!dateSalesMap[dateStr]) {
          dateSalesMap[dateStr] = { revenue: 0, profit: 0 };
        }
        dateSalesMap[dateStr].revenue += rev;
        dateSalesMap[dateStr].profit += prof;
      }
    });
  }

  // Find Top Game
  let topGame = "N/A";
  let maxGameSales = 0;
  for (const [game, count] of Object.entries(gameSalesMap)) {
    if (count > maxGameSales) {
      maxGameSales = count;
      topGame = game;
    }
  }

  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Format Chart Data
  const chartData = Object.keys(dateSalesMap).map((date) => ({
    date,
    revenue: dateSalesMap[date].revenue,
    profit: dateSalesMap[date].profit,
  }));

  const gameDistributionData = Object.keys(gameSalesMap).map((name) => ({
    name,
    value: gameSalesMap[name],
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-foreground" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analitik Bisnis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Metrik performa dan tren pendapatan berdasarkan penjualan.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load analytics: {error.message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Coins className="h-4 w-4 text-faint-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">Total Pendapatan</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{formatRupiah(totalRevenue)}</h3>
        </div>

        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-faint-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">Keuntungan Bersih</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{formatRupiah(totalProfit)}</h3>
        </div>

        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-faint-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">Rata-rata Harga Laku</span>
          </div>
          <h3 className="text-xl font-bold text-foreground">{formatRupiah(averageSaleValue)}</h3>
        </div>

        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-faint-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">Game Paling Laris</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-xl font-bold text-foreground">{topGame}</h3>
            <span className="text-xs text-faint-foreground">{maxGameSales} terjual</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <AnalyticsCharts revenueData={chartData} gameDistributionData={gameDistributionData} />
    </div>
  );
}
