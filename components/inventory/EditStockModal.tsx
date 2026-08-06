"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStock } from "@/actions/stocks";
import { uploadImage } from "@/actions/upload";
import { X, Loader2 } from "lucide-react";
import { Stock, Game } from "@/types/database";

interface EditStockModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
  categories?: Game[];
}

export function EditStockModal({ stock, isOpen, onClose, categories = [] }: EditStockModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const imageFiles = formData.getAll("imageFiles") as File[];
        const validFiles = imageFiles.filter((f) => f.size > 0);
        const uploadedUrls: string[] = [];

        for (const file of validFiles) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);
          const uploadResult = await uploadImage(fileFormData);
          if (uploadResult.success && uploadResult.url) {
            uploadedUrls.push(uploadResult.url);
          } else {
            setErrorMsg(uploadResult.error || "Gagal mengupload gambar");
            return;
          }
        }

        const existingImages = clearExisting ? [] : stock.images || [];
        const finalImages = [...existingImages, ...uploadedUrls];

        const data = {
          category: formData.get("category") as string,
          name: formData.get("name") as string,
          account_details: formData.get("account_details") as string,
          username: formData.get("username") as string,
          password: formData.get("password") as string,
          capital_price: Number(formData.get("capital_price")),
          post_price: Number(formData.get("post_price")),
          current_price: Number(formData.get("current_price")),
          images: finalImages,
        };

        const { error } = await updateStock(stock.id, data);
        if (error) {
          setErrorMsg(error);
        } else {
          router.refresh();
          onClose();
        }
      } catch (err) {
        setErrorMsg((err as { message?: string }).message || "Terjadi kesalahan saat menyimpan");
      }
    });
  }

  const inputClass =
    "w-full border border-border rounded-[10px] bg-card px-4 py-2.5 text-[15px] text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-faint-foreground";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div
        className="absolute inset-0 transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      <div className="animate-in slide-in-from-right bg-card relative flex h-full w-full max-w-md flex-col overflow-hidden shadow-2xl duration-300">
        <div className="border-border-soft bg-muted flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground text-lg font-bold">Edit Stok Akun</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-faint-foreground hover:bg-card hover:text-muted-foreground rounded-[10px] p-2 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-6 rounded-[10px] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <form id="edit-stock-form" action={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Kategori Game <span className="text-red-500">*</span>
                </label>
                {categories.length > 0 ? (
                  <select
                    required
                    name="category"
                    defaultValue={stock.category}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" disabled>
                      Pilih Kategori Game...
                    </option>
                    {categories.map((cat: Game) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="text"
                    name="category"
                    defaultValue={stock.category}
                    className={inputClass}
                    placeholder="Contoh: Mobile Legends"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Nama Paket/Ref <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  defaultValue={stock.name}
                  className={inputClass}
                  placeholder="Contoh: Akun ML Mythic Glory 50 Star"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Username / ID <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="username"
                  defaultValue={stock.username || ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="password"
                  defaultValue={stock.password || ""}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>Kode Backup / 2FA</label>
                <input
                  type="text"
                  name="backup_code"
                  defaultValue={stock.backup_code || ""}
                  className={inputClass}
                  placeholder="Opsional"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Status Stok <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="status"
                  defaultValue={stock.status}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
                  <option value="BOOKED">BOOKED (Dibooking)</option>
                  <option value="LIMITED_ACCESS">LIMITED_ACCESS (Akses Terbatas)</option>
                  <option value="SOLD">SOLD (Terjual)</option>
                  <option value="ON_HOLD">ON_HOLD (Ditahan)</option>
                  <option value="PROBLEM_ACTION">PROBLEM_ACTION (Bermasalah - Perlu Aksi)</option>
                  <option value="PROBLEM_PERMANENT">
                    PROBLEM_PERMANENT (Bermasalah Permanent)
                  </option>
                  <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Detail Akun / Spek Singkat</label>
              <textarea
                name="account_details"
                rows={2}
                defaultValue={stock.account_details || ""}
                className={inputClass}
                placeholder="Spesifikasi tambahan..."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Harga Modal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  name="capital_price"
                  defaultValue={stock.capital_price}
                  className={inputClass}
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>
                  Harga Posting (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  name="post_price"
                  defaultValue={stock.post_price}
                  className={inputClass}
                  min="0"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Harga Promo (Rp)</label>
                <input
                  type="number"
                  name="promo_price"
                  defaultValue={stock.promo_price || ""}
                  className={inputClass}
                  min="0"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="border-border space-y-1.5 rounded-[10px] border p-4">
              <label className={labelClass}>
                Gambar{" "}
                <span className="text-faint-foreground ml-1 text-xs font-normal">(Opsional)</span>
              </label>

              {stock.images && stock.images.length > 0 && (
                <div className="my-2 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {stock.images.map((img, idx) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={idx}
                        src={img}
                        alt="Current"
                        className="border-border h-12 w-12 rounded-lg border object-cover"
                      />
                    ))}
                  </div>
                  <label className="mt-1 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="border-input h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-red-600">
                      Hapus gambar lama & timpa dengan yang baru
                    </span>
                  </label>
                </div>
              )}

              <input
                type="file"
                name="imageFiles"
                multiple
                accept="image/*"
                className="border-border bg-muted text-foreground mt-2 w-full rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Pilih gambar baru untuk ditambahkan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Harga Modal (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="capital_price"
                  defaultValue={stock.capital_price}
                  type="number"
                  min="1"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Harga Posting (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="post_price"
                  defaultValue={stock.post_price}
                  type="number"
                  min="1"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="current_price"
                  defaultValue={stock.current_price}
                  type="number"
                  min="1"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="border-border-soft bg-muted/50 flex shrink-0 justify-end gap-3 border-t p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="border-border bg-card text-foreground hover:bg-muted rounded-[10px] border px-5 py-2.5 text-sm font-semibold transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="edit-stock-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-[10px] bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
