"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addGameCategory,
  updateGameCategory,
  deleteGameCategory,
  toggleGameCategoryStatus,
} from "@/actions/settings";
import { uploadImage } from "@/actions/upload";
import type { Database } from "@/types/database.types";
import { Loader2, Plus, Check, FolderTree, Edit2, Trash2, Power } from "lucide-react";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    setExistingLogoUrl(cat.logo || "");
    setIsActive(cat.is_active ?? true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    setSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setGameSlug("");
    setExistingLogoUrl("");
    setIsActive(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      let finalLogoUrl = existingLogoUrl;

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResult = await uploadImage(formData);
        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || "Gagal mengupload gambar/logo.");
          return;
        }
        finalLogoUrl = uploadResult.url;
      }

      let result;
      if (editingId) {
        result = await updateGameCategory(editingId, title, gameSlug, finalLogoUrl, isActive);
      } else {
        result = await addGameCategory(title, gameSlug, finalLogoUrl);
      }

      if (result.success) {
        setSuccess(true);
        setEditingId(null);
        setTitle("");
        setGameSlug("");
        setExistingLogoUrl("");
        setIsActive(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        setError(result.error || "Terjadi kesalahan saat menyimpan kategori.");
      }
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-3 lg:gap-5">
      {/* Left Column - Forms */}
      <div className="flex h-full min-h-0 flex-col lg:col-span-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingId ? "Edit Kategori" : "Tambah Kategori"}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-[10px] bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-[10px] bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                  <Check className="h-4 w-4" /> Kategori berhasil disimpan!
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="title">
                  Judul Kategori
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Diamond Top Up / Gift Skin"
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="gameSlug">
                  Game Slug
                </label>
                <input
                  id="gameSlug"
                  type="text"
                  required
                  value={gameSlug}
                  onChange={(e) => setGameSlug(e.target.value)}
                  placeholder="e.g. mobile-legends"
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="imageFile">
                  Logo / Icon (Opsional)
                </label>
                {existingLogoUrl && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={existingLogoUrl}
                      alt="Current logo"
                      className="h-8 w-8 rounded border border-slate-200 object-cover"
                    />
                    <span className="truncate">
                      Logo saat ini sudah ada. Upload baru untuk mengganti.
                    </span>
                  </div>
                )}
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-3 pt-1">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                  <span className="text-sm font-medium text-slate-700">
                    {isActive ? "Status Aktif" : "Status Nonaktif (Disabled)"}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending || !title || !gameSlug}
                  className="inline-flex w-full items-center justify-center space-x-2 rounded-[10px] bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      {editingId ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                      )}
                      <span>{editingId ? "Simpan Kategori" : "Tambah Kategori"}</span>
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center space-x-2 rounded-[10px] bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column - Data/Lists */}
      <div className="flex h-full min-h-0 flex-col lg:col-span-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
            <FolderTree className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">Daftar Kategori</h3>
            <span className="ml-auto inline-flex items-center rounded-[10px] bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {categories.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {errorMsg ? (
              <div className="bg-rose-50/50 p-6 text-sm text-rose-600">
                Gagal memuat kategori: {errorMsg}
              </div>
            ) : categories && categories.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 font-medium text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Logo
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Judul Kategori
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Game Slug
                    </th>
                    <th scope="col" className="px-3 py-2 text-center">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Tanggal Buat
                    </th>
                    <th scope="col" className="px-3 py-2 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {categories.map((cat: Category) => (
                    <tr
                      key={cat.id}
                      className={`transition-colors hover:bg-slate-50/50 ${
                        !cat.is_active ? "bg-slate-50/70 text-slate-400" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        {cat.logo ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cat.logo}
                              alt={cat.title}
                              className="h-8 w-8 rounded object-cover"
                            />
                          </>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-slate-100 text-xs text-slate-400">
                            ?
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{cat.title}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-400">
                        {cat.game_slug}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          disabled={isPending}
                          title={cat.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                          className="inline-flex items-center gap-1 focus:outline-none"
                        >
                          {cat.is_active ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 transition-all hover:bg-emerald-100">
                              <Power className="mr-1 h-3 w-3 text-emerald-600" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 transition-all hover:bg-slate-200">
                              <Power className="mr-1 h-3 w-3 text-slate-400" /> Nonaktif
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {new Date(cat.created_at || "").toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className="rounded-md p-1 text-blue-500 transition-colors hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="rounded-md p-1 text-red-500 transition-colors hover:bg-slate-100"
                            title="Hapus"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-sm text-slate-500">
                Belum ada kategori. Tambahkan yang pertama untuk memulai.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

