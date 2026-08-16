"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  type PromoCodeRow,
} from "@/app/actions/promo-codes";

export type FormState = {
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

export const emptyForm: FormState = {
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

export const toDateTimeLocal = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function usePromoCodes() {
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const {
    data: promos = [],
    isLoading,
    mutate,
  } = useSWR<PromoCodeRow[]>("promo-codes", async () => {
    return (await getPromoCodes()) || [];
  });

  const loadData = () => {
    mutate();
  };

  const setField = (k: keyof FormState, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const closeModal = () => {
    if (isAddClosing || isSubmitting) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const openAdd = () => {
    setError("");
    setEditing(null);
    setForm(emptyForm);
    setIsAddOpen(true);
  };

  const openEdit = (p: PromoCodeRow) => {
    setError("");
    setEditing(p.id);
    setForm({
      code: p.code,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      min_order: String(p.min_order ?? 0),
      max_discount: String(p.max_discount ?? 0),
      quota: String(p.quota ?? 0),
      is_active: p.is_active === true,
      start_date: toDateTimeLocal(p.start_date),
      end_date: toDateTimeLocal(p.end_date),
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("code", form.code.trim().toUpperCase());
      payload.set("discount_type", form.discount_type);
      payload.set(
        "discount_value",
        parseFloat(form.discount_value) ? String(form.discount_value) : "0",
      );
      payload.set("min_order", parseFloat(form.min_order) ? String(form.min_order) : "0");
      payload.set("max_discount", parseFloat(form.max_discount) ? String(form.max_discount) : "0");
      payload.set("quota", parseInt(form.quota, 10) ? String(form.quota) : "0");
      payload.set("is_active", form.is_active ? "on" : "off");
      if (form.start_date) payload.set("start_date", new Date(form.start_date).toISOString());
      if (form.end_date) payload.set("end_date", new Date(form.end_date).toISOString());

      const code = form.code.trim().toUpperCase();
      const discountValue = parseFloat(form.discount_value) || 0;

      if (!code || discountValue <= 0) {
        throw new Error("Kode promo dan nilai diskon wajib diisi dengan benar.");
      }

      if (editing) {
        await updatePromoCode(editing, payload);
      } else {
        await createPromoCode(payload);
      }

      loadData();
      setIsSubmitting(false);
      setError("");
      setIsAddClosing(true);
      setTimeout(() => {
        setIsAddClosing(false);
        setIsAddOpen(false);
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan promo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Hapus kode promo "${code}"?`)) return;
    try {
      await deletePromoCode(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus promo.");
    }
  };

  const filtered = useMemo(() => {
    return promos.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()));
  }, [promos, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    const getVal = (p: PromoCodeRow): string | number => {
      switch (sortKey) {
        case "code":
          return p.code.toLowerCase();
        case "discount":
          return Number(p.discount_value);
        case "min_order":
          return Number(p.min_order ?? 0);
        case "quota":
          return Number(p.quota ?? 0);
        case "period":
          return p.start_date || "";
        case "status":
          return p.is_active ? 1 : 0;
        default:
          return "";
      }
    };
    arr.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = sorted.slice(pageStart, pageStart + itemsPerPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  return {
    data: {
      promos,
      filtered,
      pageItems,
      totalPages,
      safePage,
      pageStart,
      itemsPerPage,
      sortKey,
      sortDir,
    },
    isLoading,
    isSubmitting,
    error,
    uiState: {
      search,
      isAddOpen,
      isAddClosing,
      editing,
      form,
      currentPage,
      itemsPerPage,
      sortKey,
      sortDir,
    },
    helpers: {
      toDateTimeLocal,
    },
    actions: {
      setSearch,
      setField,
      openAdd,
      openEdit,
      closeModal,
      handleSave,
      handleDelete,
      setCurrentPage,
      setItemsPerPage,
      handleSort,
      loadData,
    },
  };
}
export { PromoCodeRow };
