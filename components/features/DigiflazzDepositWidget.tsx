"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Coins, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface BalanceData {
  deposit: number;
  cached: boolean;
  lastChecked: string;
}

export function DigiflazzDepositWidget() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchBalance = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = `/api/digiflazz/balance${forceRefresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat saldo Digiflazz");
      }

      setData(json.data);
      lastFetchTimeRef.current = Date.now();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 1. Fetch on Mount
  useEffect(() => {
    fetchBalance(false);
  }, [fetchBalance]);

  // 2. Auto-refresh saat tab kembali aktif (jika data > 5 menit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        if (elapsed > FIVE_MINUTES_MS) {
          fetchBalance(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchBalance]);

  const deposit = data?.deposit ?? 0;

  // Status threshold
  const getStatus = () => {
    if (error) {
      return {
        label: "Tidak Terhubung",
        color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
        icon: AlertCircle,
      };
    }
    if (deposit < 100_000) {
      return {
        label: "Kritis (< Rp 100rb)",
        color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
        icon: AlertTriangle,
      };
    }
    if (deposit < 500_000) {
      return {
        label: "Perhatian (< Rp 500rb)",
        color:
          "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Aman",
      color:
        "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
      icon: CheckCircle2,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all hover:border-blue-500/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Deposit Digiflazz
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.color}`}
          >
            <StatusIcon className="h-3 w-3 shrink-0" />
            {status.label}
          </span>

          <button
            type="button"
            onClick={() => fetchBalance(true)}
            disabled={isLoading || isRefreshing}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg p-1.5 transition-colors disabled:opacity-50"
            title="Refresh Saldo Digiflazz"
            aria-label="Refresh Saldo Digiflazz"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Balance Content */}
      <div className="mt-4">
        {isLoading && !data ? (
          <div className="animate-pulse space-y-2">
            <div className="bg-muted h-7 w-40 rounded"></div>
            <div className="bg-muted h-3.5 w-24 rounded"></div>
          </div>
        ) : error && !data ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-rose-600">Gagal memuat saldo</p>
            <p className="text-muted-foreground text-xs">{error}</p>
          </div>
        ) : (
          <div>
            <h3 className="text-foreground font-mono text-2xl font-bold tracking-tight">
              {formatRupiah(deposit)}
            </h3>

            <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Dicek: {data?.lastChecked ? formatDate(data.lastChecked) : "-"}
              </span>
              {data?.cached && (
                <span className="border-border-soft bg-muted/60 text-muted-foreground py-0.2 rounded px-1.5 text-[10px] font-medium">
                  Cached
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
