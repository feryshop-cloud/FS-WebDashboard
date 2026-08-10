"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
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
  is_active: boolean;
};

export const emptyEmailAccountForm: EmailAccountForm = {
  email: "",
  display_name: "",
  is_active: true,
};

export function useEmailAccounts() {
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [editing, setEditing] = useState<EmailAccountRow | null>(null);
  const [form, setForm] = useState<EmailAccountForm>(emptyEmailAccountForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    setForm(emptyEmailAccountForm);
    setIsAddOpen(true);
  };

  const openEdit = (acc: EmailAccountRow) => {
    setError("");
    setEditing(acc);
    setForm({
      email: acc.email,
      display_name: acc.display_name || "",
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
      alert(getErrorMessage(err));
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.email.toLowerCase().includes(q) || (a.display_name || "").toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = filtered.slice(pageStart, pageStart + itemsPerPage);

  return {
    data: {
      accounts,
      filtered,
      pageItems,
      totalPages,
      safePage,
      pageStart,
      itemsPerPage,
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
      loadData,
    },
  };
}
