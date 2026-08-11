"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  transferBalance,
} from "@/app/actions/accounts";
import type { Database } from "@/types/database.types";
import { QrCode, Building2, Smartphone } from "lucide-react";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];

export function useAccounts() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddAccountClosing, setIsAddAccountClosing] = useState(false);
  const [isMutasiOpen, setIsMutasiOpen] = useState(false);
  const [isMutasiClosing, setIsMutasiClosing] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isAdjustClosing, setIsAdjustClosing] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditAccountClosing, setIsEditAccountClosing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("roles(name)")
          .eq("id", user.id)
          .maybeSingle();
        setCurrentUserRole((data?.roles as { name?: string } | null)?.name || null);
      }
    };
    fetchRole();
  }, []);

  const {
    data: accounts = [],
    isLoading,
    mutate,
  } = useSWR<Account[]>("accounts", async () => {
    return (await getAccounts()) || [];
  });

  const loadAccounts = () => {
    mutate();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAddAccount = () => {
    if (isAddAccountClosing || isSubmitting) return;
    setIsAddAccountClosing(true);
    setTimeout(() => {
      setIsAddAccountClosing(false);
      setIsAddAccountOpen(false);
    }, 200);
  };

  const openAddAccount = () => {
    setError("");
    if (isAddAccountClosing) return;
    setIsAddAccountOpen(true);
  };

  const closeEditAccount = () => {
    if (isEditAccountClosing || isSubmitting) return;
    setIsEditAccountClosing(true);
    setTimeout(() => {
      setIsEditAccountClosing(false);
      setEditingAccount(null);
    }, 200);
  };

  const closeMutasi = () => {
    if (isMutasiClosing || isSubmitting) return;
    setIsMutasiClosing(true);
    setTimeout(() => {
      setIsMutasiClosing(false);
      setIsMutasiOpen(false);
    }, 200);
  };

  const openMutasi = () => {
    setError("");
    if (isMutasiClosing) return;
    setIsMutasiOpen(true);
  };

  const handleAddAccount = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await addAccount(formData);
      loadAccounts();
      closeAddAccount();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (formData: FormData) => {
    if (!editingAccount) return;
    try {
      setIsSubmitting(true);
      setError("");
      await updateAccount(editingAccount.id, formData);
      loadAccounts();
      closeEditAccount();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus rekening "${account.name}"?`)) return;

    try {
      setIsDeletingId(account.id);
      setError("");
      await deleteAccount(account.id);
      setOpenMenuId(null);
      loadAccounts();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleMutasi = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await transferBalance(formData);
      loadAccounts();
      closeMutasi();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: adjustments = [], mutate: mutateAdjustments } = useSWR<any[]>(
    "balance-adjustments",
    async () => {
      const { getBalanceAdjustments } = await import("@/app/actions/accounts");
      return (await getBalanceAdjustments()) || [];
    },
  );

  const closeAdjust = () => {
    if (isAdjustClosing || isSubmitting) return;
    setIsAdjustClosing(true);
    setTimeout(() => {
      setIsAdjustClosing(false);
      setIsAdjustOpen(false);
    }, 200);
  };

  const openAdjust = () => {
    setError("");
    if (isAdjustClosing) return;
    setIsAdjustOpen(true);
  };

  const handleRequestAdjustment = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      const { requestBalanceAdjustment } = await import("@/app/actions/accounts");
      await requestBalanceAdjustment(formData);
      loadAccounts();
      mutateAdjustments();
      closeAdjust();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAdjustment = async (id: string) => {
    try {
      setIsSubmitting(true);
      setError("");
      const { approveBalanceAdjustment } = await import("@/app/actions/accounts");
      await approveBalanceAdjustment(id);
      loadAccounts();
      mutateAdjustments();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAdjustment = async (id: string) => {
    try {
      setIsSubmitting(true);
      setError("");
      const { rejectBalanceAdjustment } = await import("@/app/actions/accounts");
      await rejectBalanceAdjustment(id);
      loadAccounts();
      mutateAdjustments();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const getIcon = (type: string) => {
    if (type.includes("QRIS") || type.includes("QR")) return QrCode;
    if (type.includes("Bank")) return Building2;
    return Smartphone;
  };

  const getColor = (type: string) => {
    if (type.includes("QRIS")) return "text-indigo-600 bg-indigo-50 border-indigo-100";
    if (type.includes("Digital")) return "text-orange-600 bg-orange-50 border-orange-100";
    if (type.includes("Bank")) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-blue-500 bg-blue-50 border-blue-100";
  };

  return {
    data: {
      accounts,
      totalBalance,
      adjustments,
    },
    isLoading,
    isSubmitting,
    isDeletingId,
    error,
    uiState: {
      isAddAccountOpen,
      isAddAccountClosing,
      isMutasiOpen,
      isMutasiClosing,
      isAdjustOpen,
      isAdjustClosing,
      editingAccount,
      isEditAccountClosing,
      openMenuId,
      currentUserRole,
    },
    refs: {
      menuRef,
    },
    helpers: {
      getIcon,
      getColor,
    },
    actions: {
      openAddAccount,
      closeAddAccount,
      openMutasi,
      closeMutasi,
      openAdjust,
      closeAdjust,
      setEditingAccount,
      closeEditAccount,
      setOpenMenuId,
      handleAddAccount,
      handleUpdateAccount,
      handleDeleteAccount,
      handleMutasi,
      handleRequestAdjustment,
      handleApproveAdjustment,
      handleRejectAdjustment,
      loadAccounts,
    },
  };
}
