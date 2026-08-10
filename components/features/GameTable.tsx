"use client";

import React from "react";
import type { Database } from "@/types/database.types";
import { Gamepad2, Plus, Star, Power, Edit2 } from "lucide-react";
import { DynamicField } from "@/components/features/DynamicInputBuilder";

type Game = Database["public"]["Tables"]["games"]["Row"];

function parseFields(instructions: Game["instructions"]): DynamicField[] {
  if (!instructions) return [];
  if (Array.isArray(instructions)) return instructions as DynamicField[];
  if (typeof instructions !== "object") return [];
  const payload = instructions as Record<string, unknown>;

  if (Array.isArray(payload.fields) && payload.fields.length > 0) {
    return payload.fields as DynamicField[];
  }

  if (Array.isArray(payload.input_fields) && payload.input_fields.length > 0) {
    return (payload.input_fields as Record<string, unknown>[]).map((item, idx) => ({
      id: (item.name as string) || `field-${idx}`,
      name: (item.name as string) || `field_${idx}`,
      label: (item.label as string) || (item.name as string) || `Field ${idx + 1}`,
      placeholder: (item.placeholder as string) || "",
      type: (item.type as "text" | "number" | "password") || "text",
      required: true,
    }));
  }

  return [];
}

interface GameTableProps {
  games: Game[];
  errorMsg?: string;
  isPending: boolean;
  onOpenDrawerNew: () => void;
  onEditClick: (game: Game) => void;
  onToggleStatus: (game: Game) => void;
}

export function GameTable({
  games,
  errorMsg,
  isPending,
  onOpenDrawerNew,
  onEditClick,
  onToggleStatus,
}: GameTableProps) {
  return (
    <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border-soft bg-muted/50 flex items-center gap-2 border-b px-5 py-3.5">
        <Gamepad2 className="text-faint-foreground h-4 w-4" strokeWidth={1.5} />
        <h3 className="text-foreground text-sm font-semibold">Daftar Game</h3>
        <span className="bg-muted text-muted-foreground ml-auto inline-flex items-center rounded-[10px] px-2.5 py-0.5 text-xs font-medium">
          {games.length} Total
        </span>
        <button
          type="button"
          onClick={onOpenDrawerNew}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-700 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tambah Game
        </button>
      </div>

      <div className="overflow-x-auto">
        {errorMsg ? (
          <div className="bg-rose-50/50 p-6 text-sm text-rose-600">{errorMsg}</div>
        ) : games.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-border-soft bg-muted/70 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Nama Game
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Slug
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Field Input
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft text-muted-foreground divide-y">
              {games.map((game) => {
                const fieldCount = parseFields(game.instructions).length;
                return (
                  <tr
                    key={game.id}
                    className={`hover:bg-muted/50 transition-colors ${!game.is_active ? "opacity-60" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{game.name}</span>
                        {game.is_popular && (
                          <Star
                            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                            strokeWidth={1}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-muted-foreground font-mono text-xs">{game.slug}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {fieldCount > 0 ? (
                        <span className="inline-flex items-center rounded-[10px] border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {fieldCount} field
                        </span>
                      ) : (
                        <span className="text-faint-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onToggleStatus(game)}
                        disabled={isPending}
                        title={
                          game.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"
                        }
                        className="inline-flex items-center gap-1 focus:outline-none"
                      >
                        {game.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-[10px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
                            <Power className="h-3 w-3 text-emerald-600" /> Aktif
                          </span>
                        ) : (
                          <span className="border-border bg-muted text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-[10px] border px-2.5 py-1 text-xs font-semibold transition-colors">
                            <Power className="text-faint-foreground h-3 w-3" /> Nonaktif
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onEditClick(game)}
                        className="tap-large rounded-[10px] text-violet-500 transition-colors hover:bg-violet-50 hover:text-violet-700"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="bg-muted text-faint-foreground flex h-12 w-12 items-center justify-center rounded-xl">
              <Gamepad2 className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Belum ada game</p>
              <p className="text-faint-foreground mt-0.5 text-xs">
                Tambahkan game pertama menggunakan form di atas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
