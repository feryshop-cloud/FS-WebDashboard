"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RevenueData {
  date: string;
  revenue: number;
  profit: number;
}

interface GameDistributionData {
  name: string;
  value: number;
}

interface AnalyticsChartsProps {
  revenueData: RevenueData[];
  gameDistributionData: GameDistributionData[];
}

const formatYAxisNumber = (value: number) => {
  if (value === 0) return "0";
  if (value >= 1000000) {
    const formatted = (value / 1000000).toFixed(1);
    return `${formatted.replace(/\.0$/, "")}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return `${value}`;
};

const formatDateTick = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    }
  } catch {}
  return dateStr;
};

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: { fill?: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[10px] border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-500">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: TooltipPayloadItem, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-[10px]"
                style={{ backgroundColor: entry.color || entry.payload?.fill }}
              />
              <span className="text-sm font-semibold text-slate-700">{entry.name}:</span>
              <span className="text-sm font-bold text-slate-900">
                {entry.name === "Revenue" || entry.name === "Profit"
                  ? new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(entry.value ?? 0)
                  : `${entry.value} akun`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#f43f5e"];

export function AnalyticsCharts({ revenueData, gameDistributionData }: AnalyticsChartsProps) {
  const isRevenueEmpty = !revenueData || revenueData.length === 0;
  const isDistEmpty = !gameDistributionData || gameDistributionData.length === 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Column 1: Revenue Trends (Spans 2 columns on large screens) */}
      <div className="rounded-[10px] border border-slate-200 bg-white p-6 md:p-8 lg:col-span-2">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Tren Pendapatan & Profit</h3>
            <p className="mt-1 text-sm text-slate-500">
              {isRevenueEmpty
                ? "Belum ada transaksi pada periode ini"
                : "Pendapatan harian dan tren profit"}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-[10px] bg-emerald-500" />
              <span className="text-slate-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-[10px] bg-blue-500" />
              <span className="text-slate-600">Profit</span>
            </div>
          </div>
        </div>

        {isRevenueEmpty ? (
          <div className="flex h-[350px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada grafik transaksi</p>
            <p className="mt-1 text-xs text-slate-400">
              Data tren akan muncul secara otomatis setelah ada transaksi jual-beli terdata.
            </p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={formatDateTick}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={formatYAxisNumber}
                  tickMargin={10}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Column 2: Game Sales Bar Chart */}
      <div className="rounded-[10px] border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900">Total Penjualan per Game</h3>
          <p className="mt-1 text-sm text-slate-500">Volume akun terjual</p>
        </div>

        {isDistEmpty ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada penjualan</p>
            <p className="mt-1 text-xs text-slate-400">
              Data volume penjualan per game belum tersedia.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gameDistributionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickMargin={10}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Terjual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Column 3: Game Sales Distribution (Donut) */}
      <div className="rounded-[10px] border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900">Distribusi Penjualan</h3>
          <p className="mt-1 text-sm text-slate-500">Persentase berdasarkan game</p>
        </div>

        {isDistEmpty ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada distribusi</p>
            <p className="mt-1 text-xs text-slate-400">
              Persentase akan terhitung dari transaksi tercatat.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gameDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {gameDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
