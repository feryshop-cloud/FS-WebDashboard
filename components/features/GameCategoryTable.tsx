"use client";

import React from "react";
import type { Database } from "@/types/database.types";
import { FolderTree, Plus, Edit2, Trash2, Power } from "lucide-react";
import { CategoryIcon, lucideIconName } from "@/components/features/CategoryIconPicker";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface GameCategoryTableProps {
  categories: Category[];
  errorMsg?: string;
  isPending: boolean;
  onOpenDrawerNew: () => void;
  onEditClick: (cat: Category) => void;
  onToggleStatus: (cat: Category) => void;
  onDelete: (id: number) => void;
}

export function GameCategoryTable({
  categories,
  errorMsg,
  isPending,
  onOpenDrawerNew,
  onEditClick,
  onToggleStatus,
  onDelete,
}: GameCategoryTableProps) {
  return (
    <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border-soft bg-muted/50 flex items-center gap-2 border-b px-5 py-3.5">
        <FolderTree className="text-faint-foreground h-4 w-4" strokeWidth={1.5} />
        <h3 className="text-foreground text-sm font-semibold">Daftar Kategori</h3>
        <span className="bg-muted text-muted-foreground ml-auto inline-flex items-center rounded-[10px] px-2.5 py-0.5 text-xs font-medium">
          {categories.length} Total
        </span>
        <button
          type="button"
          onClick={onOpenDrawerNew}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tambah Kategori
        </button>
      </div>

      <div className="overflow-x-auto">
        {errorMsg ? (
          <div className="bg-rose-50/50 p-6 text-sm text-rose-600">{errorMsg}</div>
        ) : categories.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-border-soft bg-muted/70 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Logo
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Judul Kategori
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Slug
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Dibuat
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-border-soft text-muted-foreground divide-y">
              {categories.map((cat: Category) => (
                <tr
                  key={cat.id}
                  className={`hover:bg-muted/50 transition-colors ${!cat.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    {lucideIconName(cat.logo) ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-blue-600">
                        <CategoryIcon name={lucideIconName(cat.logo)!} className="h-4 w-4" />
                      </div>
                    ) : cat.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.logo}
                        alt={cat.title}
                        className="h-8 w-8 rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="border-border bg-muted text-faint-foreground flex h-8 w-8 items-center justify-center rounded-[10px] border text-xs">
                        ?
                      </div>
                    )}
                  </td>
                  <td className="text-foreground px-5 py-3.5 font-medium">{cat.title}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-muted-foreground font-mono text-xs">{cat.game_slug}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => onToggleStatus(cat)}
                      disabled={isPending}
                      title={cat.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                      className="inline-flex items-center gap-1 focus:outline-none"
                    >
                      {cat.is_active ? (
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
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-faint-foreground text-xs">
                      {new Date(cat.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEditClick(cat)}
                        className="tap-large rounded-[10px] text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(cat.id)}
                        className="text-faint-foreground tap-large rounded-[10px] transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Hapus"
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="bg-muted text-faint-foreground flex h-12 w-12 items-center justify-center rounded-xl">
              <FolderTree className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Belum ada kategori</p>
              <p className="text-faint-foreground mt-0.5 text-xs">
                Tambahkan kategori menggunakan form di atas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
