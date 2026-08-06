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
      <div className="border-border bg-card flex flex-shrink-0 flex-col items-start justify-between rounded-xl border p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold">TOTAL SALDO KAS</p>
          <h2 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
            {formatRupiah(totalBalance)}
          </h2>
          <p className="text-sm font-medium text-blue-600">Akumulasi dari rekening aktif</p>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row md:mt-0 md:w-auto">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="border-input bg-card text-foreground hover:bg-muted flex w-full items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors sm:w-auto"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Mutasi Saldo
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="border-input bg-card text-foreground hover:bg-muted flex w-full items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Rekening
          </button>
        </div>
      </div>

      {/* Grid of Accounts Container */}
      <div className="w-full flex-1 pb-6">
        {accounts.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-xl border p-10 text-center shadow-sm">
            <span className="mb-3 block text-3xl">💳</span>
            <p className="text-foreground text-base font-medium">Belum ada rekening terdaftar</p>
            <p className="text-faint-foreground mt-1 text-sm">
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
                  className={`border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${!isActive ? "opacity-50 grayscale" : ""} `}
                >
                  {/* Top: Full-Width Banner Image - Compressed Height */}
                  <div className="border-border-soft bg-muted relative flex h-24 w-full items-center justify-center overflow-hidden border-b">
                    {logoFile ? (
                      <Image
                        src={logoFile}
                        alt={acc.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Landmark className="text-faint-foreground h-10 w-10" />
                    )}
                  </div>

                  {/* Bottom: Text Content - Minimalist */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-3">
                      <h3 className="text-foreground mb-0.5 text-sm font-bold">{acc.name}</h3>
                      <p className="text-muted-foreground font-mono text-xs">
                        {acc.account_number || "Tidak ada no. rekening"}
                      </p>
                    </div>

                    <div className="border-border-soft mt-auto flex items-end justify-between border-t pt-3">
                      <p className="text-faint-foreground mb-0.5 text-[10px] font-semibold tracking-wider uppercase">
                        Saldo Terkini
                      </p>
                      <p className="text-foreground text-lg leading-none font-bold tracking-tight">
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
