"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

export interface TrendPoint {
  date: string;
  label: string;
  revenue: number;
  profit: number;
}

interface RevenueProfitChartProps {
  data: TrendPoint[];
}

export function RevenueProfitChart({ data }: RevenueProfitChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full min-h-55 items-center justify-center text-sm font-medium">
        Belum ada data tren keuangan.
      </div>
    );
  }

  return (
    <div className="h-full min-h-55 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
            opacity={0.4}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(val) =>
              val >= 1000000
                ? `${(val / 1000000).toFixed(0)}Jt`
                : val >= 1000
                  ? `${(val / 1000).toFixed(0)}rb`
                  : `${val}`
            }
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="border-border bg-card min-w-40 rounded-xl border p-3 text-xs shadow-lg">
                    <p className="text-foreground border-border/50 mb-2 border-b pb-1 font-bold">
                      {label}
                    </p>
                    {payload.map((entry, index) => (
                      <div
                        key={`item-${index}`}
                        className="flex items-center justify-between gap-3 py-0.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground font-medium">
                            {entry.name === "revenue" ? "Pendapatan" : "Laba (Profit)"}
                          </span>
                        </div>
                        <span className="text-foreground font-mono font-bold">
                          {formatRupiah(Number(entry.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="profit"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
