"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { addGameCategory, updateGameCategory, deleteGameCategory } from "@/actions/settings";
import { uploadImage } from "@/actions/upload";
import type { Database } from "@/types/database.types";
import { Loader2, Plus, Check, Gamepad2, Edit2, Trash2 } from "lucide-react";

type Game = Database["public"]["Tables"]["games"]["Row"];

export function GameCategoryManager({
  initialGames,
  errorMsg,
}: {
  initialGames: Game[];
  errorMsg?: string;
}) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>(initialGames);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!editingId) {
      setSlug(
        newName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
    }
  };

  const handleEditClick = (game: Game) => {
    setEditingId(game.id);
    setName(game.name);
    setSlug(game.slug);
    setExistingImageUrl(game.image_url || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    setSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setExistingImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    setSuccess(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Yakin ingin menghapus kategori ini?")) return;

    setGames((prev) => prev.filter((g) => g.id !== id));
    if (editingId === id) handleCancelEdit();

    startTransition(async () => {
      const result = await deleteGameCategory(id);
      if (!result.success) {
        setGames(initialGames);
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
      let finalImageUrl = existingImageUrl;

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResult = await uploadImage(formData);
        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || "Gagal mengupload gambar.");
          return;
        }
        finalImageUrl = uploadResult.url;
      }

      let result;
      if (editingId) {
        result = await updateGameCategory(editingId, name, slug, finalImageUrl);
      } else {
        result = await addGameCategory(name, slug, finalImageUrl);
      }

      if (result.success) {
        setSuccess(true);
        setEditingId(null);
        setName("");
        setSlug("");
        setExistingImageUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        setError(result.error || "An unexpected error occurred.");
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
              {editingId ? "Edit Kategori Game" : "Tambah Kategori Game"}
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
                  <Check className="h-4 w-4" /> Kategori game berhasil disimpan!
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                  Nama Game
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Apex Legends"
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="slug">
                  Slug
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. apex-legends"
                  className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="imageFile">
                  Gambar (Opsional)
                </label>
                {existingImageUrl && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={existingImageUrl}
                      alt="Current"
                      className="h-8 w-8 rounded border border-slate-200 object-cover"
                    />
                    <span className="truncate">
                      Gambar saat ini sudah ada. Upload baru untuk mengganti.
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

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending || !name || !slug}
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
            <Gamepad2 className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-slate-800">Daftar Kategori Game</h3>
            <span className="ml-auto inline-flex items-center rounded-[10px] bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {games.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {errorMsg ? (
              <div className="bg-rose-50/50 p-6 text-sm text-rose-600">
                Failed to load categories: {errorMsg}
              </div>
            ) : games && games.length > 0 ? (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 font-medium text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      Image
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Nama Game
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Slug
                    </th>
                    <th scope="col" className="px-3 py-2 text-right">
                      Tanggal Masuk
                    </th>
                    <th scope="col" className="px-3 py-2 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {games.map((game: Game) => (
                    <tr key={game.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        {game.image_url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={game.image_url}
                              alt={game.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          </>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-slate-100 text-xs text-slate-400">
                            ?
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{game.name}</td>
                      <td className="px-3 py-2 text-xs font-medium text-slate-400">{game.slug}</td>
                      <td className="px-3 py-2 text-right text-slate-400">
                        {new Date(game.created_at || "").toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(game)}
                            className="rounded-md p-1 text-blue-500 transition-colors hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(game.id)}
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
                Belum ada kategori game. Tambahkan yang pertama untuk memulai.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
