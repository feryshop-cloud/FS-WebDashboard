"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addGameCategory,
  updateGameCategory,
  deleteGameCategory,
  toggleGameCategoryStatus,
} from "@/actions/settings";
import type { Database } from "@/types/database.types";
import { Loader2, Plus, Check, LayoutGrid, X } from "lucide-react";
import {
  CategoryIconPicker,
  LUCIDE_PREFIX,
  lucideIconName,
} from "@/components/features/CategoryIconPicker";
import { GameCategoryTable } from "./GameCategoryTable";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function GameCategoryManager({
  initialCategories,
  errorMsg,
}: {
  initialCategories: Category[];
  errorMsg?: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [prevCategories, setPrevCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (initialCategories !== prevCategories) {
    setPrevCategories(initialCategories);
    setCategories(initialCategories);
  }

  const openDrawerNew = () => {
    if (isDrawerClosing) return;
    setEditingId(null);
    setTitle("");
    setGameSlug("");
    setSelectedIcon("");
    setIsActive(true);
    setError(null);
    setSuccess(false);
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingId) {
      setGameSlug(
        newTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  };

  const handleEditClick = (cat: Category) => {
    if (isDrawerClosing) return;
    setEditingId(cat.id);
    setTitle(cat.title);
    setGameSlug(cat.game_slug);
    setSelectedIcon(lucideIconName(cat.logo) || "");
    setIsActive(cat.is_active ?? true);
    setError(null);
    setSuccess(false);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title || !gameSlug) {
      setError("Judul dan Game Slug wajib diisi.");
      return;
    }

    const logoValue = selectedIcon ? `${LUCIDE_PREFIX}${selectedIcon}` : null;

    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateGameCategory(
          editingId,
          title,
          gameSlug,
          logoValue || undefined,
          isActive,
        );
      } else {
        res = await addGameCategory(title, gameSlug, logoValue || undefined);
      }

      if (res.success) {
        setSuccess(true);
        router.refresh();
        closeDrawer();
      } else {
        setError(res.error || "Gagal menyimpan kategori.");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    startTransition(async () => {
      const res = await deleteGameCategory(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        alert(res.error || "Gagal menghapus kategori.");
      }
    });
  };

  const handleToggleStatus = (cat: Category) => {
    const nextStatus = !cat.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextStatus } : c)),
    );

    startTransition(async () => {
      const res = await toggleGameCategoryStatus(cat.id, nextStatus);
      if (!res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: cat.is_active } : c)),
        );
        alert(res.error || "Gagal mengubah status kategori.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <LayoutGrid className="h-4.5 w-4.5" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-foreground text-base font-bold">Master Kategori Game</h2>
          <p className="text-muted-foreground text-xs">
            Kelola kategori game untuk inventori dan topup produk.
          </p>
        </div>
      </div>

      {/* Drawer — Tambah / Edit Kategori */}
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
                <h3 className="text-foreground text-base font-bold">
                  {editingId ? "Edit Kategori" : "Tambah Kategori"}
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {editingId ? "Perbarui detail kategori game." : "Tambahkan kategori game baru."}
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
                    <Check className="h-4 w-4" /> Kategori berhasil disimpan!
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase"
                    htmlFor="cat-title"
                  >
                    Judul Kategori
                  </label>
                  <input
                    id="cat-title"
                    type="text"
                    required
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Diamond Top Up"
                    className="border-border bg-card text-foreground placeholder:text-faint-foreground w-full rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase"
                    htmlFor="cat-slug"
                  >
                    Game Slug
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    required
                    value={gameSlug}
                    onChange={(e) => setGameSlug(e.target.value)}
                    placeholder="mobile-legends"
                    className="bg-card text-foreground placeholder:text-faint-foreground border-border w-full rounded-[10px] border px-3.5 py-2.5 font-mono text-sm transition-colors placeholder:font-sans focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase">
                    Ikon
                  </label>
                  <CategoryIconPicker value={selectedIcon} onChange={setSelectedIcon} />
                </div>

                {editingId && (
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
                )}
              </div>

              <div className="border-border-soft bg-card border-t p-6">
                <div className="flex w-full flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isPending || !title || !gameSlug}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    <span>
                      {isPending
                        ? "Menyimpan..."
                        : editingId
                          ? "Simpan Kategori"
                          : "Tambah Kategori"}
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
      <GameCategoryTable
        categories={categories}
        errorMsg={errorMsg}
        isPending={isPending}
        onOpenDrawerNew={openDrawerNew}
        onEditClick={handleEditClick}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
