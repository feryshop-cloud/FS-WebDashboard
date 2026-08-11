"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  getEmailAccounts,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  type EmailAccountRow,
} from "@/app/actions/email-accounts";

export type EmailAccountForm = {
  email: string;
  display_name: string;
  access_pin: string;
  is_active: boolean;
};

export const emptyEmailAccountForm: EmailAccountForm = {
  email: "",
  display_name: "",
  access_pin: "123456",
  is_active: true,
};

export function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useEmailAccounts() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [editing, setEditing] = useState<EmailAccountRow | null>(null);
  const [form, setForm] = useState<EmailAccountForm>(emptyEmailAccountForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const {
    data: accounts = [],
    isLoading,
    mutate,
  } = useSWR<EmailAccountRow[]>("email-accounts", async () => {
    return (await getEmailAccounts()) || [];
  });

  const loadData = () => {
    mutate();
  };

  const setField = (k: keyof EmailAccountForm, v: string | boolean) =>
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
    setForm({
      ...emptyEmailAccountForm,
      access_pin: generateRandomPin(),
    });
    setIsAddOpen(true);
  };

  const openEdit = (acc: EmailAccountRow) => {
    setError("");
    setEditing(acc);
    setForm({
      email: acc.email,
      display_name: acc.display_name || "",
      access_pin: (acc as unknown as { access_pin?: string }).access_pin || "123456",
      is_active: acc.is_active,
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.email.trim()) {
        throw new Error("Alamat email wajib diisi.");
      }

      const payload = new FormData();
      payload.set("email", form.email.trim());
      payload.set("display_name", form.display_name.trim());
      payload.set("access_pin", form.access_pin.trim() || "123456");
      payload.set("is_active", form.is_active ? "on" : "off");

      if (editing) {
        await updateEmailAccount(editing.id, payload);
      } else {
        await createEmailAccount(payload);
      }

      closeModal();
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (acc: EmailAccountRow) => {
    if (!confirm(`Hapus akun email "${acc.email}"? Email yang masuk juga akan ikut terhapus.`)) {
      return;
    }

    try {
      await deleteEmailAccount(acc.id);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return accounts;

    return accounts.filter((acc) => {
      const e = acc.email.toLowerCase();
      const d = (acc.display_name || "").toLowerCase();
      const p = ((acc as unknown as { access_pin?: string }).access_pin || "").toLowerCase();
      return e.includes(q) || d.includes(q) || p.includes(q);
    });
  }, [accounts, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, safePage, itemsPerPage]);

  return {
    data: {
      accounts,
      filtered,
      pageItems,
      safePage,
      itemsPerPage,
      totalPages,
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
      generateNewPin: () => setField("access_pin", generateRandomPin()),
    },
  };
}
