"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Clock, Plus } from "lucide-react";
import { formatRupiah, formatDate, getBasePath } from "@/lib/utils";
import { DigiflazzDepositModal } from "./DigiflazzDepositModal";

interface BalanceData {
  deposit: number;
  cached: boolean;
  lastChecked: string;
}

function getStatus(deposit: number, hasError: boolean) {
  if (hasError) {
    return {
      label: "Terputus",
      icon: AlertCircle,
      chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
    };
  }
  if (deposit < 100_000) {
    return {
      label: "Kritis",
      icon: AlertTriangle,
      chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
    };
  }
  if (deposit < 500_000) {
    return {
      label: "Perhatian",
      icon: AlertTriangle,
      chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
    };
  }
  return {
    label: "Aman",
    icon: CheckCircle2,
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  };
}

export function DigiflazzDepositWidget() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchBalance = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const basePath = getBasePath();
      const url = `${basePath}/api/digiflazz/balance${forceRefresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);

      let json: { ok?: boolean; data?: BalanceData; error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        throw new Error(
          res.ok
            ? "Format respons server tidak valid"
            : `Gagal memuat saldo (${res.status} ${res.statusText})`,
        );
      }

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Gagal memuat saldo (HTTP ${res.status})`);
      }

      if (json?.data) {
        setData(json.data);
      }
      lastFetchTimeRef.current = Date.now();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance(false);
  }, [fetchBalance]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed > 5 * 60 * 1000) {
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
  const status = getStatus(deposit, !!error);
  const StatusIcon = status.icon;

  return (
    <div className="border-border-soft bg-card flex flex-col justify-between rounded-xl border p-6 shadow-sm transition-colors">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Deposit Digiflazz
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            title="Tambah Deposit Saldo"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Isi Saldo</span>
          </button>
          <button
            type="button"
            onClick={() => fetchBalance(true)}
            disabled={isLoading || isRefreshing}
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary rounded-lg p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            title="Refresh saldo"
            aria-label="Refresh saldo Digiflazz"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "text-primary animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="animate-pulse space-y-2.5">
          <div className="bg-muted h-8 w-44 rounded" />
          <div className="bg-muted h-4 w-28 rounded" />
        </div>
      ) : error && !data ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Gagal memuat saldo
          </p>
          <p className="text-muted-foreground text-xs">{error}</p>
          <button
            type="button"
            onClick={() => fetchBalance(true)}
            className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-primary rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-foreground font-mono text-2xl font-bold tracking-tight">
            {formatRupiah(deposit)}
          </h3>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.chip}`}
            >
              <StatusIcon className="h-3 w-3 shrink-0" />
              {status.label}
            </span>
          </div>

          <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{data?.lastChecked ? formatDate(data.lastChecked) : "—"}</span>
            {data?.cached && (
              <span className="border-border-soft bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium">
                Cache
              </span>
            )}
          </div>
        </>
      )}

      {/* Modal Tambah Saldo Deposit */}
      <DigiflazzDepositModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchBalance(true)}
      />
    </div>
  );
}
