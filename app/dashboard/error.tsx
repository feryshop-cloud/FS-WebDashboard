"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="border-border-soft bg-card w-full max-w-md rounded-2xl border p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="text-foreground text-xl font-bold tracking-tight">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {error.message && !error.message.includes("Minified React error")
            ? error.message
            : "Halaman ini mengalami kendala teknis saat memuat data atau merender komponen."}
        </p>

        {error.digest && (
          <p className="bg-muted text-faint-foreground mt-3 rounded-lg px-2.5 py-1 font-mono text-xs">
            Digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.97]"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
