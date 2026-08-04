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
    setEditingId(cat.id);
    setTitle(cat.title);
    setGameSlug(cat.game_slug);
    setSelectedIcon(lucideIconName(cat.logo) || "");
    setIsActive(cat.is_active ?? true);
    setError(null);
    setSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setGameSlug("");
    setSelectedIcon("");
    setIsActive(true);
    setError(null);
    setSuccess(false);
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
          <h2 className="text-base font-bold text-slate-900">Master Kategori Game</h2>
          <p className="text-xs text-slate-500">
            Kelola kategori game untuk inventori dan topup produk.
          </p>
        </div>
      </div>

      {/* Form — full width, fields in a row */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">
            {editingId ? "Edit Kategori" : "Tambah Kategori"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-[10px] p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Batal edit"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 rounded-[10px] bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                <Check className="h-4 w-4" /> Kategori berhasil disimpan!
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold tracking-wide text-slate-600 uppercase"
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
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold tracking-wide text-slate-600 uppercase"
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
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-700 transition-colors placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  Ikon
                </label>
                <CategoryIconPicker value={selectedIcon} onChange={setSelectedIcon} />
              </div>

              <div className="flex flex-col justify-end gap-2">
                {editingId && (
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </label>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending || !title || !gameSlug}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    <span>{isPending ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isPending}
                      className="inline-flex items-center justify-center rounded-[10px] bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* List — full width below */}
      <div>
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
            <FolderTree className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">Daftar Kategori</h3>
            <span className="ml-auto inline-flex items-center rounded-[10px] bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {categories.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            {errorMsg ? (
              <div className="bg-rose-50/50 p-6 text-sm text-rose-600">{errorMsg}</div>
            ) : categories.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold tracking-wider text-slate-500 uppercase">
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
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {categories.map((cat: Category) => (
                    <tr
                      key={cat.id}
                      className={`transition-colors hover:bg-slate-50/50 ${!cat.is_active ? "opacity-60" : ""}`}
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
                          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-100 text-xs text-slate-400">
                            ?
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{cat.title}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-500">{cat.game_slug}</span>
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
                            <span className="inline-flex items-center gap-1 rounded-[10px] border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200">
                              <Power className="h-3 w-3 text-slate-400" /> Nonaktif
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs text-slate-400">
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
                            className="rounded-[10px] p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <FolderTree className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Belum ada kategori</p>
                  <p className="mt-0.5 text-xs text-slate-400">
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
