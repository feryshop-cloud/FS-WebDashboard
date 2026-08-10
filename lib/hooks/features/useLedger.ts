"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { getLedgers, addManualLedger, updateLedger, deleteLedger } from "@/app/actions/ledger";
import { getAccounts } from "@/app/actions/accounts";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { LedgerWithRelations } from "@/types/database";
import type { Database } from "@/types/database.types";

export type LedgerRecord = LedgerWithRelations;
export type Account = Database["public"]["Tables"]["accounts"]["Row"];

export function useLedger() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId") || undefined;

  const [ledgers, setLedgers] = useState<LedgerRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingLedger, setEditingLedger] = useState<LedgerRecord | null>(null);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isAddManualClosing, setIsAddManualClosing] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadLedgerData = () => {
    setIsLoading(true);
    Promise.all([getLedgers(currentPage, itemsPerPage, accountId), getAccounts()])
      .then(([ledgerRes, accountsData]) => {
        setLedgers((ledgerRes.data as LedgerRecord[]) || []);
        setTotalCount(ledgerRes.totalCount || 0);
        setAccounts(accountsData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([getLedgers(currentPage, itemsPerPage, accountId), getAccounts()])
      .then(([ledgerRes, accountsData]) => {
        if (isMounted) {
          setLedgers((ledgerRes.data as LedgerRecord[]) || []);
          setTotalCount(ledgerRes.totalCount || 0);
          setAccounts(accountsData || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, accountId, itemsPerPage]);

  const handlePageSizeChange = (size: number) => {
    if (size === itemsPerPage) return;
    setCurrentPage(1);
    setItemsPerPage(size);
  };

  const closeAddManual = () => {
    if (isAddManualClosing || isSubmitting) return;
    setIsAddManualClosing(true);
    setTimeout(() => {
      setIsAddManualClosing(false);
      setIsAddManualOpen(false);
    }, 200);
  };

  const openAddManual = () => {
    setError("");
    if (isAddManualClosing) return;
    setIsAddManualOpen(true);
  };

  const editLedger = (tx: LedgerRecord) => {
    if (isEditClosing) return;
    setError("");
    setEditingLedger(tx);
  };

  const closeEdit = () => {
    if (isEditClosing || isSubmitting) return;
    setIsEditClosing(true);
    setTimeout(() => {
      setIsEditClosing(false);
      setEditingLedger(null);
    }, 200);
  };

  const addManualRef = useFocusTrap<HTMLDivElement>(
    isAddManualOpen || isAddManualClosing,
    null,
    closeAddManual,
  );
  const editRef = useFocusTrap<HTMLDivElement>(!!editingLedger, null, closeEdit);

  const handleAddManual = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await addManualLedger(formData);
      loadLedgerData();
      closeAddManual();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingLedger) return;
    try {
      setIsSubmitting(true);
      setError("");
      await updateLedger(editingLedger.id, formData);
      loadLedgerData();
      closeEdit();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tx: LedgerRecord) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus entri kas ini (${tx.notes || tx.id})?`)) return;

    try {
      setIsDeletingId(tx.id);
      setError("");
      await deleteLedger(tx.id);
      loadLedgerData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredLedgers = useMemo(() => {
    const termLower = searchTerm.trim().toLowerCase();
    return ledgers.filter((item) => {
      const matchesSearch =
        !termLower ||
        item.id?.toLowerCase().includes(termLower) ||
        item.notes?.toLowerCase().includes(termLower) ||
        item.ref_id?.toLowerCase().includes(termLower);

      const record = item as unknown as Record<string, unknown>;
      const matchesType =
        typeFilter === "ALL" ||
        record.type === typeFilter ||
        record.transaction_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [ledgers, searchTerm, typeFilter]);

  const handleExportExcel = () => {
    if (filteredLedgers.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const headers = [
      "Tanggal",
      "ID Transaksi",
      "Tipe Transaksi",
      "Rekening",
      "Referensi",
      "Catatan",
      "Nominal (Rp)",
    ];

    const rows = filteredLedgers.map((tx) => [
      formatDate(tx.created_at),
      tx.id,
      tx.transaction_type,
      tx.accounts?.name || "-",
      tx.ref_id || "-",
      `"${(tx.notes || "-").replace(/"/g, '""')}"`,
      tx.amount,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `buku_kas_ledger_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    data: {
      ledgers,
      accounts,
      filteredLedgers,
      totalCount,
    },
    isLoading,
    isSubmitting,
    isDeletingId,
    error,
    uiState: {
      searchTerm,
      typeFilter,
      currentPage,
      itemsPerPage,
      editingLedger,
      isAddManualOpen,
      isAddManualClosing,
      isEditClosing,
      accountId,
    },
    refs: {
      addManualRef,
      editRef,
    },
    actions: {
      setSearchTerm,
      setTypeFilter,
      setCurrentPage,
      setItemsPerPage,
      handlePageSizeChange,
      openAddManual,
      closeAddManual,
      editLedger,
      closeEdit,
      handleAddManual,
      handleUpdate,
      handleDelete,
      handleExportExcel,
      loadLedgerData,
    },
  };
}
