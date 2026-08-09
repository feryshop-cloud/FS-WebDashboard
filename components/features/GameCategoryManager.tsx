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
import {
  Loader2,
  Plus,
  Check,
  FolderTree,
  Edit2,
  Trash2,
  Power,
  LayoutGrid,
  X,
} from "lucide-react";
import {
  CategoryIcon,
  CategoryIconPicker,
  LUCIDE_PREFIX,
  lucideIconName,
} from "@/components/features/CategoryIconPicker";

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

  // Keep local state in sync when server props revalidate
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setGameSlug("");
    setSelectedIcon("");
    setIsActive(true);
    setError(null);
    setSuccess(false);
    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (cat: Category) => {
    const nextStatus = !cat.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: nextStatus } : c)),
    );
    startTransition(async () => {
      const result = await toggleGameCategoryStatus(cat.id, nextStatus);
      if (!result.success) {
        setCategories(initialCategories);
        alert(`Gagal mengubah status: ${result.error}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Yakin ingin menghapus kategori ini?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) handleCancelEdit();
    startTransition(async () => {
      const result = await deleteGameCategory(id);
      if (!result.success) {
        setCategories(initialCategories);
        alert(`Gagal menghapus: ${result.error}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const finalLogo = selectedIcon ? `${LUCIDE_PREFIX}${selectedIcon}` : null;

      let result: { success: boolean; error?: string; data?: Category | null };
      if (editingId) {
        result = await updateGameCategory(
          editingId,
          title,
          gameSlug,
          finalLogo || undefined,
          isActive,
        );
        if (result.success) {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, title, game_slug: gameSlug, logo: finalLogo, is_active: isActive }
                : c,
            ),
          );
        }
      } else {
        result = await addGameCategory(title, gameSlug, finalLogo || undefined);
        if (result.success && result.data) {
          setCategories((prev) => [...prev, result.data as Category]);
        }
      }

      if (result.success) {
        setSuccess(true);
        setEditingId(null);
        setTitle("");
        setGameSlug("");
        setSelectedIcon("");
        setIsActive(true);
        router.refresh();
        closeDrawer();
      } else {
        setError(result.error || "Terjadi kesalahan saat menyimpan kategori.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600">
          <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.5} />
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
                      <div className="peer bg-muted after:border-input after:bg-card h-5 w-9 rounded-full transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
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

      {/* List — full width below */}
      <div>
        <div className="border-border-soft bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="border-border-soft bg-muted/50 flex items-center gap-2 border-b px-5 py-3.5">
            <FolderTree className="text-faint-foreground h-4 w-4" strokeWidth={1.5} />
            <h3 className="text-foreground text-sm font-semibold">Daftar Kategori</h3>
            <span className="bg-muted text-muted-foreground ml-auto inline-flex items-center rounded-[10px] px-2.5 py-0.5 text-xs font-medium">
              {categories.length} Total
            </span>
            <button
              type="button"
              onClick={openDrawerNew}
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
                        <span className="text-muted-foreground font-mono text-xs">
                          {cat.game_slug}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          disabled={isPending}
                          title={
                            cat.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"
                          }
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
                            onClick={() => handleEditClick(cat)}
                            className="rounded-[10px] p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-faint-foreground rounded-[10px] p-1.5 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
      </div>
    </div>
  );
}
