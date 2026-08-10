"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import {
  getProblemCases,
  createProblemCase,
  updateProblemCase,
  deleteProblemCase,
} from "@/app/actions/problem-cases";
import { getDeals } from "@/app/actions/deals";
import { getInventory } from "@/app/actions/inventory";
import {
  ProblemCaseWithRelations,
  DealWithRelations,
  InventoryItemWithGame,
} from "@/types/database";

export const PROBLEM_CASE_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Ditindaklanjuti",
  WAITING_CUSTOMER: "Menunggu Customer",
  WAITING_THIRD_PARTY: "Menunggu Pihak Ketiga",
  RESOLVED: "Selesai",
  CANNOT_RESOLVE: "Tidak Bisa Diselesaikan",
  PERMANENT: "Permanen",
  REFUND: "Refund",
  CANCEL: "Cancel",
};

export function useProblemCases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ProblemCaseWithRelations | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [relatedType, setRelatedType] = useState("NONE");

  const [editStatus, setEditStatus] = useState("");
  const [editChronology, setEditChronology] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editIssueType, setEditIssueType] = useState("");

  const {
    data: cases = [],
    isLoading: casesLoading,
    mutate: mutateCases,
  } = useSWR<ProblemCaseWithRelations[]>("problem-cases", async () => {
    return (await getProblemCases()) || [];
  });

  const {
    data: deals = [],
    isLoading: dealsLoading,
    mutate: mutateDeals,
  } = useSWR<DealWithRelations[]>("deals", async () => {
    return ((await getDeals()) as unknown as DealWithRelations[]) || [];
  });

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    mutate: mutateStocks,
  } = useSWR<InventoryItemWithGame[]>("inventory", async () => {
    const result = await getInventory();
    return (result.data || []) as InventoryItemWithGame[];
  });

  const isLoading = casesLoading || dealsLoading || stocksLoading;

  const loadData = () => {
    mutateCases();
    mutateDeals();
    mutateStocks();
  };

  const openAdd = () => {
    setError("");
    if (isAddClosing) return;
    setIsAddOpen(true);
  };

  const closeAdd = () => {
    if (isAddClosing || isSubmitting) return;
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddClosing(false);
      setIsAddOpen(false);
    }, 200);
  };

  const handleOpenDetail = (c: ProblemCaseWithRelations) => {
    if (isDetailClosing) return;
    setError("");
    setSelectedCase(c);
    setEditStatus((c.status as string) || "OPEN");
    setEditChronology((c.chronology as string) || "");
    setEditIssueType((c.issue_type as string) || "");
  };

  const closeDetail = () => {
    if (isDetailClosing || isSubmitting) return;
    setIsDetailClosing(true);
    setTimeout(() => {
      setIsDetailClosing(false);
      setSelectedCase(null);
    }, 200);
  };

  const handleAddCase = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createProblemCase(formData);
      loadData();
      closeAdd();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      setError("");
      await updateProblemCase(selectedCase.id, {
        status: editStatus,
        chronology: editChronology,
        issue_type: editIssueType,
      });
      loadData();
      closeDetail();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (id: string, code?: string | null) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kasus kendala ${code || id}?`)) return;
    try {
      setIsDeletingId(id);
      setError("");
      await deleteProblemCase(id);
      loadData();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredCases = useMemo(() => {
    const termLower = searchTerm.trim().toLowerCase();
    return cases.filter((c) => {
      const matchesSearch =
        termLower === "" ||
        String(c.case_number || "")
          .toLowerCase()
          .includes(termLower) ||
        String(c.title || "")
          .toLowerCase()
          .includes(termLower) ||
        String(c.chronology || "")
          .toLowerCase()
          .includes(termLower) ||
        String(c.issue_type || "")
          .toLowerCase()
          .includes(termLower);

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageItems = filteredCases.slice(pageStart, pageStart + itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === "OPEN") return "bg-rose-50 text-rose-600 border-rose-100";
    if (status === "IN_PROGRESS") return "bg-amber-50 text-amber-600 border-amber-100";
    if (status === "RESOLVED") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-muted text-muted-foreground border-border";
  };

  return {
    data: {
      cases,
      deals,
      stocks,
      filteredCases,
      pageItems,
      totalPages,
      safePage,
      pageStart,
      itemsPerPage,
    },
    isLoading,
    isSubmitting,
    isDeletingId,
    error,
    uiState: {
      searchTerm,
      statusFilter,
      isAddOpen,
      isAddClosing,
      selectedCase,
      isDetailClosing,
      relatedType,
      editStatus,
      editChronology,
      editIssueType,
      currentPage,
      itemsPerPage,
    },
    helpers: {
      PROBLEM_CASE_STATUS_LABEL,
      getStatusBadge,
    },
    actions: {
      setSearchTerm,
      setStatusFilter,
      openAdd,
      closeAdd,
      handleOpenDetail,
      closeDetail,
      setRelatedType,
      setEditStatus,
      setEditChronology,
      setEditIssueType,
      handleAddCase,
      handleUpdateCase,
      handleDeleteCase,
      setCurrentPage,
      setItemsPerPage,
      loadData,
    },
  };
}
