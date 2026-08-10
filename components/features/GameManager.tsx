"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGame, updateGame, toggleGameStatus } from "@/actions/settings";
import type { Database } from "@/types/database.types";
import { Loader2, Plus, Check, Gamepad2, X } from "lucide-react";
import { DynamicInputBuilder, DynamicField } from "@/components/features/DynamicInputBuilder";
import { GameTable } from "./GameTable";

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

export function GameManager({
  initialGames,
  errorMsg,
}: {
  initialGames: Game[];
  errorMsg?: string;
}) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>(initialGames);
  const [prevGames, setPrevGames] = useState(initialGames);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync when server props revalidate
  if (initialGames !== prevGames) {
    setPrevGames(initialGames);
    setGames(initialGames);
  }

  const openDrawerNew = () => {
    if (isDrawerClosing) return;
    resetFields();
    setEditingId(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (isDrawerClosing || isPending) return;
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerClosing(false);
      setIsDrawerOpen(false);
    }, 200);
  };

  const resetFields = () => {
    setName("");
    setSlug("");
    setIsActive(true);
    setIsPopular(false);
    setFields([]);
    setError(null);
    setSuccess(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  };

  const handleEditClick = (game: Game) => {
    if (isDrawerClosing) return;
    setEditingId(game.id);
    setName(game.name);
    setSlug(game.slug);
    setIsActive(game.is_active ?? true);
    setIsPopular(game.is_popular ?? false);
    setFields(parseFields(game.instructions));
    setError(null);
    setSuccess(false);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name) {
      setError("Nama game wajib diisi.");
      return;
    }

    const gameSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateGame(editingId, name, gameSlug, undefined, isActive, isPopular, fields);
      } else {
        res = await addGame(name, gameSlug, undefined, fields);
      }

      if (res.success) {
        setSuccess(true);
        router.refresh();
        closeDrawer();
      } else {
        setError(res.error || "Gagal menyimpan game.");
      }
    });
  };

  const handleToggleStatus = (game: Game) => {
    const nextStatus = !game.is_active;
    setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, is_active: nextStatus } : g)));

    startTransition(async () => {
      const res = await toggleGameStatus(game.id, nextStatus);
      if (!res.success) {
        setGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, is_active: game.is_active } : g)),
        );
        alert(res.error || "Gagal mengubah status game.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Gamepad2 className="h-4.5 w-4.5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-foreground font-sans text-base font-bold">Master Game</h2>
          <p className="text-muted-foreground text-xs">
            Kelola game dan konfigurasi field input order pembeli.
          </p>
        </div>
      </div>

      {/* Drawer — Tambah / Edit Game */}
      {(isDrawerOpen || isDrawerClosing) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm ${
            isDrawerClosing ? "fs-overlay-out" : "fs-overlay-in"
          }`}
          onClick={closeDrawer}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-card border-border-soft flex h-full w-full max-w-lg flex-col border-l shadow-2xl ${
              isDrawerClosing ? "fs-drawer-out" : "fs-drawer-in"
            }`}
          >
            <div className="border-border-soft flex items-center justify-between border-b px-6 py-5">
              <div>
                <h3 className="text-foreground font-sans text-base font-bold">
                  {editingId ? "Edit Game" : "Tambah Game"}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editingId
                    ? "Perbarui detail game dan field input order."
                    : "Tambahkan game baru beserta field input order."}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                disabled={isPending}
                className="text-faint-foreground hover:bg-muted hover:text-muted-foreground rounded-lg p-1 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="fs-rise-in flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {error && (
                  <div className="fs-drop-in rounded-[10px] bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-[10px] bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-4 w-4" /> Game berhasil disimpan!
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase"
                    htmlFor="game-name"
                  >
                    Nama Game
                  </label>
                  <input
                    id="game-name"
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Mobile Legends"
                    className="border-border bg-card text-foreground placeholder:text-faint-foreground w-full rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase"
                    htmlFor="game-slug"
                  >
                    Slug
                  </label>
                  <input
                    id="game-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto dari nama game"
                    className="border-border bg-card text-foreground placeholder:text-faint-foreground w-full rounded-[10px] border px-3.5 py-2.5 font-mono text-sm transition-colors placeholder:font-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>

                {editingId && (
                  <div className="flex items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer bg-muted after:border-input after:bg-card h-5 w-9 rounded-full transition-colors peer-checked:bg-emerald-500 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        {isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isPopular}
                          onChange={(e) => setIsPopular(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer bg-muted after:border-input after:bg-card h-5 w-9 rounded-full transition-colors peer-checked:bg-amber-400 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        {isPopular ? "Populer" : "Tidak Populer"}
                      </span>
                    </label>
                  </div>
                )}

                <DynamicInputBuilder fields={fields} onChange={setFields} />
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <div className="flex w-full flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isPending || !name}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    <span>
                      {isPending ? "Menyimpan..." : editingId ? "Simpan Game" : "Tambah Game"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    disabled={isPending}
                    className="text-muted-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-[10px] px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <GameTable
        games={games}
        errorMsg={errorMsg}
        isPending={isPending}
        onOpenDrawerNew={openDrawerNew}
        onEditClick={handleEditClick}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
