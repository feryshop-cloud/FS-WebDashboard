"use client";

import { useState } from "react";
import Image from "next/image";
import { Account } from "@/types/database";
import { Plus, ArrowRightLeft, Landmark } from "lucide-react";
import { AddAccountModal } from "./AddAccountModal";
import { TransferFundsModal } from "./TransferFundsModal";
import { formatRupiah } from "@/lib/utils";

interface AccountsClientProps {
  accounts: Account[];
}

const LOGO_MAP: { keyword: string; file: string | null }[] = [
  { keyword: "qris", file: "/img/rekening/QRIS.webp" },
  { keyword: "dana", file: "/img/rekening/DANA.webp" },
  { keyword: "ovo", file: "/img/rekening/OVO.webp" },
  { keyword: "gopay", file: "/img/rekening/GOPAY.webp" },
  { keyword: "mandiri", file: "/img/rekening/MANDIRI.webp" },
  { keyword: "seabank", file: "/img/rekening/SEABANK.webp" },
  { keyword: "jago", file: null },
  { keyword: "bca", file: null },
];

function getAccountLogo(name: string): { file: string | null } {
  const lower = name.toLowerCase();
  for (const entry of LOGO_MAP) {
    if (lower.includes(entry.keyword)) {
      return { file: entry.file };
    }
  }
  return { file: null };
}

export function AccountsClient({ accounts }: AccountsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.is_active ? Number(acc.balance) : 0),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-hidden">
      {/* Hero Header Replicated from image_d4fa7b.png */}
      <div className="flex flex-shrink-0 flex-col items-start justify-between rounded-xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">TOTAL SALDO KAS</p>
          <h2 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
            {formatRupiah(totalBalance)}
          </h2>
          <p className="text-sm font-medium text-blue-600">Akumulasi dari rekening aktif</p>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row md:mt-0 md:w-auto">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Mutasi Saldo
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Rekening
          </button>
        </div>
      </div>

      {/* Grid of Accounts Container */}
      <div className="w-full flex-1 pb-6">
        {accounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground shadow-sm">
            <span className="mb-3 block text-3xl">💳</span>
            <p className="text-base font-medium text-foreground">Belum ada rekening terdaftar</p>
            <p className="mt-1 text-sm text-faint-foreground">
              Silakan tambahkan rekening baru untuk mulai mencatat keuangan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((acc) => {
              const { file: logoFile } = getAccountLogo(acc.name);
              const isActive = acc.is_active;

              return (
                <div
                  key={acc.id}
                  className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${!isActive ? "opacity-50 grayscale" : ""} `}
                >
                  {/* Top: Full-Width Banner Image - Compressed Height */}
                  <div className="relative flex h-24 w-full items-center justify-center overflow-hidden border-b border-border-soft bg-muted">
                    {logoFile ? (
                      <Image
                        src={logoFile}
                        alt={acc.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Landmark className="h-10 w-10 text-faint-foreground" />
                    )}
                  </div>

                  {/* Bottom: Text Content - Minimalist */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3">
                      <h3 className="mb-0.5 text-sm font-bold text-foreground">{acc.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {acc.account_number || "Tidak ada no. rekening"}
                      </p>
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-border-soft pt-3">
                      <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-faint-foreground uppercase">
                        Saldo Terkini
                      </p>
                      <p className="text-lg leading-none font-bold tracking-tight text-foreground">
                        {formatRupiah(acc.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAccountModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      <TransferFundsModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
