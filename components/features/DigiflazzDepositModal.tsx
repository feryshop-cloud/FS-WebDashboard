"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Building2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Clock,
  RotateCcw,
} from "lucide-react";
import { formatRupiah, formatDate, getBasePath } from "@/lib/utils";

interface DepositTicketResult {
  rc: string;
  bank: string;
  payment_method: string;
  account_no: string;
  notes: string;
  amount: number;
  expires_at: string;
  created_at?: string;
}

interface DigiflazzDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STORAGE_KEY = "fs_active_digiflazz_deposit_ticket";
const DEPOSIT_TIMEOUT_HOURS = 8; // Tetap 8 jam, tidak dapat diubah manual

const PRESET_AMOUNTS = [
  { label: "100rb", value: 100_000 },
  { label: "250rb", value: 250_000 },
  { label: "500rb", value: 500_000 },
  { label: "1 Juta", value: 1_000_000 },
  { label: "2.5 Juta", value: 2_500_000 },
  { label: "5 Juta", value: 5_000_000 },
];

const AVAILABLE_BANKS = [
  { id: "BCA", name: "BCA", type: "Perusahaan" },
  { id: "MANDIRI", name: "Mandiri", type: "Perusahaan" },
  { id: "BNI", name: "BNI", type: "Perusahaan" },
  { id: "BRI", name: "BRI", type: "Perusahaan" },
  { id: "Flip", name: "Flip", type: "Perorangan" },
  { id: "ShopeePay", name: "ShopeePay", type: "Perorangan" },
];

export function DigiflazzDepositModal({ isOpen, onClose, onSuccess }: DigiflazzDepositModalProps) {
  const [amount, setAmount] = useState<number>(500_000);
  const [bank, setBank] = useState<string>("BCA");
  const [ownerName, setOwnerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<DepositTicketResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Pulihkan tiket aktif dari localStorage saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DepositTicketResult;
        const expiryMs = new Date(parsed.expires_at).getTime();
        if (expiryMs > Date.now()) {
          setTicketResult(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }
  }, [isOpen]);

  // 2. Hitung mundur waktu pembayaran (otomatis 8 jam)
  useEffect(() => {
    if (!ticketResult?.expires_at) return;

    const updateRemaining = () => {
      const expiryMs = new Date(ticketResult.expires_at).getTime();
      const diff = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [ticketResult]);

  if (!isOpen) return null;

  const isExpired = !!ticketResult && remainingSeconds <= 0;

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleCopy = async (text: string, field: string) => {
    if (isExpired) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || amount < 10_000) {
      setErrorMsg("Nominal deposit minimal Rp 10.000");
      return;
    }

    if (!ownerName.trim()) {
      setErrorMsg("Nama pemilik rekening pengirim wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/digiflazz/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.floor(amount),
          bank,
          ownerName: ownerName.trim(),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Gagal membuat tiket deposit (HTTP ${res.status})`);
      }

      // Pastikan batas waktu strictly 8 jam dari waktu sekarang
      const now = new Date();
      const fixedExpiresAt =
        json.data.expires_at ||
        new Date(now.getTime() + DEPOSIT_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString();

      const newTicket: DepositTicketResult = {
        ...json.data,
        expires_at: fixedExpiresAt,
        created_at: now.toISOString(),
      };

      setTicketResult(newTicket);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTicket));
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses tiket";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setTicketResult(null);
    onSuccess();
    onClose();
  };

  const handleResetTicket = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setTicketResult(null);
    setErrorMsg(null);
  };

  const handleModalClose = () => {
    if (!isLoading) {
      setErrorMsg(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleModalClose}
      />

      {/* Modal Container */}
      <div className="border-border bg-card relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                {ticketResult ? "Tiket Deposit Digiflazz" : "Isi Deposit Digiflazz"}
              </h2>
              <p className="text-muted-foreground text-xs">
                {ticketResult
                  ? "Selesaikan transfer sesuai nominal kode unik"
                  : "Buat tiket transfer resmi ke rekening Digiflazz"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {!ticketResult ? (
          /* Form Input */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nominal Section */}
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Nominal Deposit (IDR)
              </label>
              <div className="relative mt-1.5">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Contoh: 500000"
                  className="border-input bg-background text-foreground focus:ring-primary h-11 w-full rounded-xl border pr-4 pl-11 font-mono text-base font-semibold transition focus:ring-2 focus:outline-none"
                  required
                />
              </div>

              {/* Preset Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAmount(preset.value)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      amount === preset.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Pilih Bank Tujuan Transfer
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {AVAILABLE_BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBank(b.id)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition ${
                      bank === b.id
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40"
                        : "border-border hover:border-muted-foreground/30 bg-background"
                    }`}
                  >
                    <Building2
                      className={`h-4 w-4 ${
                        bank === b.id ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-foreground mt-1 text-xs font-bold">{b.name}</span>
                    <span className="text-muted-foreground text-[10px]">{b.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Name Input */}
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Nama Pemilik Rekening Pengirim
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nama sesuai rekening / e-wallet pengirim"
                className="border-input bg-background text-foreground focus:ring-primary mt-1.5 h-10 w-full rounded-xl border px-3 text-sm transition focus:ring-2 focus:outline-none"
                required
              />
              <p className="text-muted-foreground mt-1 text-[11px]">
                Wajib mencantumkan nama yang sama dengan rekening pengirim agar terverifikasi.
              </p>
            </div>

            {/* Timeout Info (Fixed 8 hours) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Batas Waktu Pembayaran: Maksimal 8 Jam</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Batas waktu pembayaran tiket ditetapkan otomatis selama <strong>8 jam</strong> oleh
                sistem dan tidak dapat diatur manual. Tiket akan kedaluwarsa jika transfer tidak
                diselesaikan dalam kurun waktu tersebut.
              </p>
            </div>

            {/* Warning Info */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Digiflazz akan menambahkan <strong>kode unik otomatis</strong> pada nominal
                transfer. Pastikan Anda mentransfer sesuai angka unik tersebut nantinya.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat Tiket Deposit...
                  </>
                ) : (
                  <>
                    Buat Tiket Deposit
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Ticket Result Screen */
          <div className="mt-4 space-y-4">
            {/* Countdown / Timeout Banner */}
            {!isExpired ? (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-semibold">Sisa Waktu Pembayaran:</span>
                    <p className="text-[10px] text-blue-700 dark:text-blue-300">
                      Batas maksimal 8 jam (otomatis sistem)
                    </p>
                  </div>
                </div>
                <div className="font-mono text-base font-extrabold tracking-wider text-blue-700 dark:text-blue-300">
                  {formattedCountdown}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold">Waktu Pembayaran Telah Habis (Kedaluwarsa)</p>
                  <p className="mt-0.5 text-[11px]">
                    Tiket ini telah melewati batas waktu 8 jam. <strong>Jangan mentransfer</strong>{" "}
                    ke nomor rekening tiket ini. Silakan buat tiket baru.
                  </p>
                </div>
              </div>
            )}

            {/* Warning Box */}
            {!isExpired && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">PENTING: Transfer Tepat Sesuai Nominal</p>
                  <p className="mt-0.5 text-[11px]">
                    Jangan membulatkan angka transfer. Saldo akan otomatis masuk dalam 1–3 menit
                    jika nominal transfer sesuai hingga digit terakhir.
                  </p>
                </div>
              </div>
            )}

            {/* Exact Transfer Amount */}
            <div
              className={`rounded-xl border p-4 ${
                isExpired
                  ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/30"
                  : "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/30"
              }`}
            >
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Total Transfer Persis
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className={`font-mono text-2xl font-extrabold ${
                    isExpired ? "text-slate-400 line-through" : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {formatRupiah(ticketResult.amount)}
                </span>
                {!isExpired && (
                  <button
                    type="button"
                    onClick={() => handleCopy(String(ticketResult.amount), "amount")}
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {copiedField === "amount" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Salin Nominal
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div
              className={`space-y-2 rounded-xl border p-4 text-xs dark:border-slate-800 ${
                isExpired ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                <span className="text-muted-foreground">Bank Tujuan</span>
                <span className="text-foreground font-bold">
                  {ticketResult.bank} ({ticketResult.payment_method})
                </span>
              </div>

              <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                <span className="text-muted-foreground">Nomor Rekening</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono text-sm font-bold">
                    {ticketResult.account_no}
                  </span>
                  {!isExpired && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(ticketResult.account_no.replace(/\s+/g, ""), "account")
                      }
                      className="text-muted-foreground hover:text-foreground rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Salin No Rekening"
                    >
                      {copiedField === "account" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {ticketResult.notes && (
                <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                  <span className="text-muted-foreground">Berita / Catatan</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-xs font-bold">
                      {ticketResult.notes}
                    </span>
                    {!isExpired && (
                      <button
                        type="button"
                        onClick={() => handleCopy(ticketResult.notes, "notes")}
                        className="text-muted-foreground hover:text-foreground rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Salin Berita Transfer"
                      >
                        {copiedField === "notes" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Kedaluwarsa Pada</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {formatDate(ticketResult.expires_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {isExpired ? (
                <button
                  type="button"
                  onClick={handleResetTicket}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-md transition hover:bg-blue-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Buat Tiket Baru
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetTicket}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    title="Batalkan tiket ini dan buat baru"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Tiket Baru
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white shadow-md transition hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                    Selesai & Cek Saldo
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
