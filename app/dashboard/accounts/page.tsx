"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  Plus,
  ArrowRightLeft,
  Wallet,
  Building2,
  Smartphone,
  QrCode,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getAccounts, addAccount, transferBalance } from "@/app/actions/accounts";
import type { Database } from "@/types/database.types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];

export default function AccountsPage() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isMutasiOpen, setIsMutasiOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, []);

  const handleAddAccount = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await addAccount(formData);
      setIsAddAccountOpen(false);
      loadAccounts();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMutasi = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await transferBalance(formData);
      setIsMutasiOpen(false);
      loadAccounts();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const getIcon = (type: string) => {
    if (type.includes("QRIS") || type.includes("QR")) return QrCode;
    if (type.includes("Bank")) return Building2;
    return Smartphone;
  };

  const getColor = (type: string) => {
    if (type.includes("QRIS")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
    if (type.includes("Digital")) return "text-orange-600 bg-orange-50 border-orange-100";
    if (type.includes("Bank")) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-blue-500 bg-blue-50 border-blue-100";
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Rekening</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pantau saldo, kelola metode pembayaran, dan mutasi antar dompet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMutasiOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Mutasi Saldo
          </button>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Rekening
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="group relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full w-64 opacity-[0.02] transition-opacity group-hover:opacity-5"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          <path d="M0,50 L0,30 Q25,50 50,20 T100,10 L100,50 Z" fill="#2563eb" />
        </svg>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Total Saldo Kas
            </h2>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalBalance)}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-end rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="text-xs font-medium text-slate-500">Jumlah Rekening Aktif</span>
          <span className="text-lg font-bold text-slate-800">
            {accounts.filter((a) => a.is_active).length}
          </span>
        </div>
      </div>

      {/* Grid of Accounts */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const IconComponent = getIcon(account.type);
            const colorClass = getColor(account.type);
            return (
              <div
                key={account.id}
                className="group relative rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute top-4 right-4">
                  <button className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${colorClass}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base leading-tight font-bold text-slate-900">
                      {account.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">{account.type}</p>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                    Nomor Rekening / ID
                  </p>
                  <p className="font-mono text-sm font-semibold tracking-wide text-slate-700">
                    {account.account_number || "-"}
                  </p>
                </div>

                <div className="flex items-end justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      Saldo Terkini
                    </p>
                    <p className="text-xl font-bold tracking-tight text-slate-900">
                      {formatRupiah(Number(account.balance))}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/ledger?accountId=${account.id}`}
                    className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                  >
                    Riwayat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal (Slide-over Drawer) */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tambah Rekening Baru</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Isi form untuk menambah rekening atau metode pembayaran baru.
                </p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleAddAccount} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nama Rekening
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. BCA Fery"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipe Rekening
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Bank Konvensional">Bank Konvensional</option>
                    <option value="Bank Digital">Bank Digital</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="E-Wallet/QRIS">E-Wallet/QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nomor Rekening / ID
                  </label>
                  <input
                    name="account_number"
                    type="text"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mis. 1234567890"
                  />
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Rekening</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mutasi Modal (Slide-over Drawer) */}
      {isMutasiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-md flex-col bg-white shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mutasi Saldo</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Pindahkan saldo antar rekening atau dompet digital.
                </p>
              </div>
              <button
                onClick={() => setIsMutasiOpen(false)}
                className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={handleMutasi} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Dari Rekening
                  </label>
                  <select
                    name="from_account_id"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - {formatRupiah(Number(acc.balance))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative z-10 -my-2 flex justify-center">
                  <div className="rounded-full border border-white bg-slate-100 p-1">
                    <ArrowRightLeft className="h-4 w-4 rotate-90 text-slate-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ke Rekening
                  </label>
                  <select
                    name="to_account_id"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nominal Mutasi
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Rp 0"
                  />
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Proses Mutasi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
