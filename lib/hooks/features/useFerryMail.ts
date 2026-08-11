"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import { getErrorMessage } from "@/lib/error";
import {
  getIncomingEmails,
  deleteIncomingEmails,
  markIncomingEmailsRead,
  setIncomingEmailsArchived,
  type IncomingEmailRow,
} from "@/app/actions/incoming-emails";
import { getEmailAccounts, type EmailAccountRow } from "@/app/actions/email-accounts";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { rowToEmail, type Email } from "@/lib/ferrymail";

export function useFerryMail() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [activeTab, setActiveTab] = useState("utama");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const menuRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useSWR<EmailAccountRow[]>(
    "email-accounts-active",
    async () => {
      const all = (await getEmailAccounts()) || [];
      return all.filter((a) => a.is_active);
    },
  );

  const {
    data: rows = [],
    isLoading,
    mutate,
  } = useSWR<IncomingEmailRow[]>(
    selectedAccountId === "all" ? "incoming-emails" : `incoming-emails:${selectedAccountId}`,
    async () => {
      return (
        (await getIncomingEmails(selectedAccountId === "all" ? undefined : selectedAccountId)) || []
      );
    },
  );

  const [emails, setEmails] = useState<Email[]>([]);

  // Sinkronkan data DB ke state (isRead diambil dari DB; star/check state UI lokal).
  useEffect(() => {
    if (isLoading) return;
    if (rows.length === 0) {
      setEmails([]);
      return;
    }
    setEmails((prev) => {
      const prevByKey = new Map(prev.map((e) => [e.id, e]));
      return rows.map(rowToEmail).map((e) => {
        const p = prevByKey.get(e.id);
        if (p) {
          return { ...e, isChecked: p.isChecked, isStarred: p.isStarred };
        }
        return e;
      });
    });
  }, [isLoading, rows]);

  const filteredEmails = useMemo(
    () =>
      emails.filter((email) => {
        const matchesSearch =
          email.sender.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          email.subject.toLowerCase().includes(debouncedSearch.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === "arsip") {
          return email.isArchived;
        }
        if (email.isArchived) return false;

        if (activeTab === "favorit") {
          return email.isStarred;
        }
        return true;
      }),
    [emails, debouncedSearch, activeTab],
  );

  // Reset halaman saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, selectedAccountId]);

  const totalPages = Math.max(1, Math.ceil(filteredEmails.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredEmails.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const toggleCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, isChecked: !email.isChecked } : email)),
    );
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) => (email.id === id ? { ...email, isStarred: !email.isStarred } : email)),
    );
  };

  const allFilteredChecked = filteredEmails.length > 0 && filteredEmails.every((e) => e.isChecked);

  const toggleAllChecks = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((email) => {
        if (filteredEmails.some((f) => f.id === email.id)) {
          return { ...email, isChecked: !allFilteredChecked };
        }
        return email;
      }),
    );
  };

  const reloadInbox = () => {
    startTransition(async () => {
      await mutate();
    });
  };

  const checkedIds = emails.filter((e) => e.isChecked).map((e) => e.id);
  const allCheckedArchived =
    checkedIds.length > 0 && checkedIds.every((id) => emails.find((e) => e.id === id)?.isArchived);

  const removeEmails = (ids: string[]) => {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
  };

  const handleDeleteEmail = async (email: Email) => {
    if (!confirm(`Hapus email dari "${email.sender}"?`)) return;
    try {
      setIsDeleting(true);
      await deleteIncomingEmails([email.id]);
      removeEmails([email.id]);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (checkedIds.length === 0) return;
    if (!confirm(`Hapus ${checkedIds.length} email yang dipilih?`)) return;
    try {
      setIsDeleting(true);
      await deleteIncomingEmails(checkedIds);
      removeEmails(checkedIds);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const markAsRead = async () => {
    const targets = checkedIds.length > 0 ? checkedIds : filteredEmails.map((e) => e.id);
    if (targets.length === 0) return;
    setEmails((prev) =>
      prev.map((email) => (targets.includes(email.id) ? { ...email, isRead: true } : email)),
    );
    setOpenMenu(false);
    try {
      await markIncomingEmailsRead(targets);
      void mutate();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const setArchived = async (ids: string[], archived: boolean) => {
    if (ids.length === 0) return;
    setEmails((prev) =>
      prev.map((email) => (ids.includes(email.id) ? { ...email, isArchived: archived } : email)),
    );
    try {
      await setIncomingEmailsArchived(ids, archived);
      void mutate();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const bulkToggleArchive = async () => {
    if (checkedIds.length === 0) return;
    await setArchived(checkedIds, !allCheckedArchived);
  };

  return {
    data: {
      emails,
      filteredEmails,
      pageItems,
      totalFiltered: filteredEmails.length,
      totalPages,
      currentPage: safePage,
      isLoading,
      isLoadingAccounts,
      accounts,
    },
    uiState: {
      searchQuery,
      activeTab,
      allFilteredChecked,
      selectedAccountId,
      isDeleting,
      checkedCount: checkedIds.length,
      openMenu,
      allCheckedArchived,
    },
    refs: {
      menuRef,
    },
    actions: {
      setSearchQuery,
      setActiveTab,
      setSelectedAccountId,
      setCurrentPage,
      toggleCheck,
      toggleStar,
      toggleAllChecks,
      reloadInbox,
      handleDeleteEmail,
      handleBulkDelete,
      markAsRead,
      setOpenMenu,
      bulkToggleArchive,
    },
  };
}
