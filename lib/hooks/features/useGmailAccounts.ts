"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  getGmailAccounts,
  createGmailAccount,
  updateGmailAccount,
  updateGmailAccountStatus,
  deleteGmailAccount,
  getGmailAccountStatusLogs,
} from "@/app/actions/gmail-accounts";
import type { GmailAccount, GmailAccountStatus, GmailAccountStatusLog } from "@/types/database";

export type GmailAccountForm = {
  email: string;
  google_password: string;
  backup_codes: string;
  notes: string;
  status: GmailAccountStatus;
};

export const emptyGmailAccountForm: GmailAccountForm = {
  email: "",
  google_password: "",
  backup_codes: "",
  notes: "",
  status: "Belum diamankan",
};

export function useGmailAccounts() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Modal Add / Edit
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [editing, setEditing] = useState<GmailAccount | null>(null);
  const [form, setForm] = useState<GmailAccountForm>(emptyGmailAccountForm);

  // Status Logs Drawer / Modal
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedAccountForLogs, setSelectedAccountForLogs] = useState<GmailAccount | null>(null);
  const [logs, setLogs] = useState<GmailAccountStatusLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const {
    data: accounts = [],
    isLoading,
    mutate,
  } = useSWR<GmailAccount[]>("gmail-accounts", async () => {
    return (await getGmailAccounts()) || [];
  });

  const loadData = () => {
    mutate();
  };

  const setField = (k: keyof GmailAccountForm, v: string) =>
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
    setForm(emptyGmailAccountForm);
    setIsAddOpen(true);
  };

  const openEdit = (acc: GmailAccount) => {
    setError("");
    setEditing(acc);
    setForm({
      email: acc.email,
      google_password: acc.google_password || "",
      backup_codes: acc.backup_codes || "",
      notes: acc.notes || "",
      status: acc.status,
    });
    setIsAddOpen(true);
  };

  const openStatusLogs = async (acc: GmailAccount) => {
    setSelectedAccountForLogs(acc);
    setIsLogsOpen(true);
    setIsLogsLoading(true);
    try {
      const data = await getGmailAccountStatusLogs(acc.id);
      setLogs(data);
    } catch (err) {
      console.error("Gagal memuat log status:", err);
      setLogs([]);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const closeStatusLogs = () => {
    setIsLogsOpen(false);
    setSelectedAccountForLogs(null);
    setLogs([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!form.email.trim()) {
        throw new Error("Alamat email Gmail wajib diisi.");
      }

      const payload = new FormData();
      payload.set("email", form.email.trim());
      payload.set("google_password", form.google_password.trim());
      payload.set("backup_codes", form.backup_codes.trim());
      payload.set("notes", form.notes.trim());
      payload.set("status", form.status);

      if (editing) {
        await updateGmailAccount(editing.id, payload);
      } else {
        await createGmailAccount(payload);
      }

      closeModal();
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (
    acc: GmailAccount,
    newStatus: GmailAccountStatus,
    reason?: string,
  ) => {
    if (acc.status === newStatus) return;

    try {
      await updateGmailAccountStatus(acc.id, newStatus, reason);
      loadData();
      if (selectedAccountForLogs && selectedAccountForLogs.id === acc.id) {
        const updatedLogs = await getGmailAccountStatusLogs(acc.id);
        setLogs(updatedLogs);
      }
    } catch (err) {
      alert(`Gagal mengubah status: ${getErrorMessage(err)}`);
    }
  };

  const handleDelete = async (acc: GmailAccount) => {
    if (
      !confirm(
        `Hapus akun Gmail "${acc.email}" dari inventori? Seluruh riwayat perubahan status juga akan dihapus.`,
      )
    ) {
      return;
    }

    try {
      await deleteGmailAccount(acc.id);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const total = accounts.length;
    let belumDiamankan = 0;
    let diproses = 0;
    let dipakaiSementara = 0;
    let stokPermanen = 0;
    let diserahkanCustomer = 0;
    let bermasalah = 0;
    let nonAktif = 0;

    for (const acc of accounts) {
      switch (acc.status) {
        case "Belum diamankan":
          belumDiamankan++;
          break;
        case "Diproses":
          diproses++;
          break;
        case "Dipakai sementara":
          dipakaiSementara++;
          break;
        case "Stok Permanen":
          stokPermanen++;
          break;
        case "Diserahkan ke Customer":
          diserahkanCustomer++;
          break;
        case "Bermasalah":
          bermasalah++;
          break;
        case "Non Aktif":
          nonAktif++;
          break;
      }
    }

    return {
      total,
      belumDiamankan,
      diproses,
      dipakaiSementara,
      stokPermanen,
      diserahkanCustomer,
      bermasalah,
      nonAktif,
    };
  }, [accounts]);

  // Filtering
  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      // Status filter
      if (statusFilter !== "ALL" && acc.status !== statusFilter) {
        return false;
      }

      // Search filter
      const q = debouncedSearch.trim().toLowerCase();
      if (!q) return true;

      const emailMatch = acc.email.toLowerCase().includes(q);
      const notesMatch = (acc.notes || "").toLowerCase().includes(q);
      const statusMatch = acc.status.toLowerCase().includes(q);
      const managerMatch = (acc.manager?.full_name || "").toLowerCase().includes(q);

      return emailMatch || notesMatch || statusMatch || managerMatch;
    });
  }, [accounts, statusFilter, debouncedSearch]);

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
      kpis,
      logs,
    },
    isLoading,
    isSubmitting,
    isLogsLoading,
    error,
    uiState: {
      search,
      statusFilter,
      isAddOpen,
      isAddClosing,
      editing,
      form,
      isLogsOpen,
      selectedAccountForLogs,
    },
    actions: {
      setSearch,
      setStatusFilter,
      setField,
      openAdd,
      openEdit,
      closeModal,
      openStatusLogs,
      closeStatusLogs,
      handleSave,
      handleQuickStatusChange,
      handleDelete,
      setCurrentPage,
      setItemsPerPage,
      loadData,
    },
  };
}
