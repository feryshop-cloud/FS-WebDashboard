"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addInventoryItem } from "@/actions/inventory";
import { Loader2, UploadCloud, ChevronDown, Check, X } from "lucide-react";

type Game = {
  id: string;
  name: string;
};

export function AddInventoryForm({ games }: { games: Game[] }) {
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    if (!selectedGameId) {
      setError("Please select a game category.");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one screenshot.");
      return;
    }

    images.forEach((img) => {
      formData.append("images", img);
    });

    startTransition(async () => {
      const result = await addInventoryItem(formData);
      if (result.success) {
        router.push("/dashboard/inventory");
      } else {
        setError(result.error || "Terjadi kesalahan tidak terduga.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[10px] bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative space-y-1" ref={dropdownRef}>
          <label className="block text-sm font-medium text-foreground">Pilih Kategori Game</label>
          <input type="hidden" name="game_id" value={selectedGameId} required />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-[10px] border border-border bg-muted px-3 py-2 text-foreground transition-colors hover:bg-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <span className={selectedGameId ? "text-foreground" : "text-muted-foreground"}>
              {selectedGameId
                ? games.find((g) => g.id === selectedGameId)?.name
                : "Select a game..."}
            </span>
            <ChevronDown className="h-4 w-4 text-faint-foreground" />
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[10px] border border-border bg-card py-1">
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setSelectedGameId(game.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  {game.name}
                  {selectedGameId === game.id && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="title_reference">
            Kode Unik Akun
          </label>
          <input
            id="title_reference"
            name="title_reference"
            type="text"
            required
            placeholder="e.g. ML-MYTHIC-001"
            className="w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-foreground transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Upload Screenshot Akun (Max 20)
        </label>

        {images.length > 0 && (
          <div className="mb-4 grid grid-cols-4 gap-3 md:grid-cols-5">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-[10px] border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${idx}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 rounded-[10px] bg-card/90 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-card hover:text-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 20 && (
          <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-dashed border-border bg-muted transition-colors hover:bg-muted">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
              <UploadCloud className="mb-3 h-8 w-8 text-faint-foreground transition-colors group-hover:text-blue-500" />
              <p className="mb-2 text-sm">
                <span className="font-semibold text-blue-600">Klik untuk upload</span> atau seret
                file ke sini
              </p>
              <p className="text-xs">
                PNG, JPG or WEBP (MAX. 5MB) - {20 - images.length} slot tersisa
              </p>
            </div>
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (images.length + files.length > 20) {
                  alert("Maksimal 20 gambar yang diperbolehkan.");
                  return;
                }
                setImages((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground" htmlFor="account_specs">
          Spesifikasi Akun (Rank, Skin, Winrate...)
        </label>
        <textarea
          id="account_specs"
          name="account_specs"
          required
          rows={4}
          placeholder="Details like rank, skins, win rate..."
          className="w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-foreground transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="capital_price">
            Harga Modal (Rp)
          </label>
          <input
            id="capital_price"
            name="capital_price"
            type="number"
            min="0"
            required
            placeholder="e.g. 500000"
            className="w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-foreground transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground" htmlFor="asking_price">
            Target Jual
          </label>
          <input
            id="asking_price"
            name="asking_price"
            type="number"
            min="0"
            required
            placeholder="e.g. 750000"
            className="w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-foreground transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-[10px] bg-blue-600 px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Data Akun"
          )}
        </button>
      </div>
    </form>
  );
}
