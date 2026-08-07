"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit, X, Save, Loader2, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  type PromoCodeRow,
} from "@/app/actions/promo-codes";

type FormState = {
  code: string;
  discount_type: string;
  discount_value: string;
  min_order: string;
  max_discount: string;
  quota: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
};

const emptyForm: FormState = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order: "0",
  max_discount: "0",
  quota: "100",
  is_active: true,
  start_date: "",
  end_date: "",
};

const toDateTimeLocal = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setIsLoading(true);
      setError("");
      const data = await getPromoCodes();
      setPromos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kode promo.");
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getPromoCodes()
      .then((data) => {
        if (isMounted) setPromos(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Gagal memuat kode promo.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const setField = (k: keyof FormState, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const openAdd = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsAddOpen(true);
  };

  const openEdit = (p: PromoCodeRow) => {
    setForm({
      code: p.code,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value ?? ""),
      min_order: String(p.min_order ?? "0"),
      max_discount: String(p.max_discount ?? "0"),
      quota: String(p.quota ?? 100),
      is_active: p.is_active !== false,
      start_date: toDateTimeLocal(p.start_date),
      end_date: toDateTimeLocal(p.end_date),
    });
    setEditing(p.id);
    setIsAddOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("code", form.code);
    fd.append("discount_type", form.discount_type);
    fd.append("discount_value", String(Number(form.discount_value) || 0));
    fd.append("min_order", String(Number(form.min_order) || 0));
    fd.append("max_discount", String(Number(form.max_discount) || 0));
    fd.append("quota", String(Number(form.quota) || 100));
    fd.append("is_active", form.is_active ? "on" : "off");
    fd.append("start_date", form.start_date || "");
    fd.append("end_date", form.end_date || "");
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const fd = buildFormData();
      if (editing !== null) {
        await updatePromoCode(editing, fd);
      } else {
        await createPromoCode(fd);
      }
      setIsAddOpen(false);
      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kode promo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Hapus kode promo ${code}?`)) return;
    setIsSubmitting(true);
    setError("");
    try {
      await deletePromoCode(id);
      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kode promo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = promos.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()));

  const discountLabel = (p: PromoCodeRow) =>
    p.discount_type === "percent"
      ? `${Number(p.discount_value)}%`
      : formatRupiah(Math.floor(Number(p.discount_value)));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Kode Promo</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Kelola kode promo untuk checkout storefront (diskon, kuota, periode berlakunya).
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Kode Promo
        </button>
      </div>

      {error && (
        <div className="border-border-soft border-l-4 border-l-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="text-faint-foreground absolute top-2.5 left-3 h-4 w-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode promo..."
          className="border-border bg-card w-full rounded-lg border py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-border-soft text-muted-foreground flex flex-col items-center gap-2 rounded-xl border py-12 text-sm">
          <Tag className="h-6 w-6 opacity-40" />
          Belum ada kode promo.
        </div>
      ) : (
        <div className="border-border-soft bg-card overflow-x-auto rounded-xl border shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-border-soft bg-muted/50 text-faint-foreground border-b text-xs font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Kode</th>
                <th className="px-4 py-3">Diskon</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Kuota (Terpakai)</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const quota = p.quota ?? 0;
                const used = p.used_count ?? 0;
                const full = quota > 0 && used >= quota;
                return (
                  <tr
                    key={p.id}
                    className="border-border-soft hover:bg-muted/30 border-b last:border-0"
                  >
                    <td className="px-5 py-3 font-bold text-blue-600">{p.code}</td>
                    <td className="px-4 py-3">{discountLabel(p)}</td>
                    <td className="px-4 py-3">{formatRupiah(Number(p.min_order || 0))}</td>
                    <td className="px-4 py-3">
                      {used} / {quota === 0 ? "∞" : quota}
                      {full && (
                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                          Habis
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {p.start_date || p.end_date
                        ? `${p.start_date ? new Date(p.start_date).toLocaleDateString("id-ID") : "-"} → ${p.end_date ? new Date(p.end_date).toLocaleDateString("id-ID") : "-"}`
                        : "Selalu"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          p.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          disabled={isSubmitting}
                          className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl p-6 shadow-xl">
            <div className="border-border-soft flex items-center justify-between border-b pb-3">
              <h3 className="text-foreground text-base font-bold">
                {editing !== null ? "Edit Kode Promo" : "Tambah Kode Promo"}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-faint-foreground hover:bg-muted rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Kode Promo
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value.toUpperCase())}
                    required
                    placeholder="CONTOH10"
                    className="border-border w-full rounded-lg border px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Tipe Diskon
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setField("discount_type", e.target.value)}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="percent">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setField("discount_value", e.target.value)}
                    required
                    min="1"
                    placeholder="10 / 5000"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Min Order (Rp)
                  </label>
                  <input
                    type="number"
                    value={form.min_order}
                    onChange={(e) => setField("min_order", e.target.value)}
                    min="0"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Maks Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    value={form.max_discount}
                    onChange={(e) => setField("max_discount", e.target.value)}
                    min="0"
                    placeholder="0 = tanpa batas"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Kuota Total
                  </label>
                  <input
                    type="number"
                    value={form.quota}
                    onChange={(e) => setField("quota", e.target.value)}
                    min="0"
                    placeholder="100"
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                      className="h-4 w-4"
                    />
                    Aktif
                  </label>
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">Mulai</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setField("start_date", e.target.value)}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block text-xs font-semibold">
                    Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setField("end_date", e.target.value)}
                    className="border-border w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-border-soft mt-2 flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                  className="bg-muted text-muted-foreground hover:bg-muted rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  {isSubmitting ? "Menyimpan..." : editing !== null ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
