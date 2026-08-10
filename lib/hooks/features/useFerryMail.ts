"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  time: string;
  date: string;
  body: string;
  otp: string;
  avatarBg: string;
  avatarText: string;
  isChecked?: boolean;
  isStarred?: boolean;
  isRead?: boolean;
  isArchived?: boolean;
}

const publisherMeta: { domains: string[]; name: string; bg: string }[] = [
  {
    domains: ["moonton.com"],
    name: "Moonton",
    bg: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    domains: ["riotgames.com", "mail.accounts.riotgames.com"],
    name: "Riot Games",
    bg: "bg-gradient-to-br from-red-600 to-rose-700",
  },
  {
    domains: ["vk.com"],
    name: "VK",
    bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    domains: ["steampowered.com"],
    name: "Steam Support",
    bg: "bg-gradient-to-br from-slate-700 to-slate-900",
  },
  {
    domains: ["hoyoverse.com"],
    name: "Hoyoverse",
    bg: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
  {
    domains: ["garena.com"],
    name: "Garena",
    bg: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  {
    domains: ["supercell.com"],
    name: "Supercell",
    bg: "bg-gradient-to-br from-amber-400 to-yellow-600",
  },
  {
    domains: ["epicgames.com"],
    name: "Epic Games",
    bg: "bg-gradient-to-br from-indigo-500 to-blue-600",
  },
  {
    domains: ["netease.com"],
    name: "NetEase",
    bg: "bg-gradient-to-br from-blue-600 to-indigo-700",
  },
  {
    domains: ["activision.com"],
    name: "Activision",
    bg: "bg-gradient-to-br from-rose-500 to-red-700",
  },
];

function metaFor(email: string): { name: string; bg: string } {
  const domain = email.split("@").pop()?.toLowerCase() || "";
  const hit = publisherMeta.find((m) => m.domains.some((d) => domain.includes(d)));
  if (hit) return { name: hit.name, bg: hit.bg };
  const fallbackBgs = [
    "bg-gradient-to-br from-slate-500 to-slate-700",
    "bg-gradient-to-br from-blue-500 to-cyan-600",
    "bg-gradient-to-br from-violet-500 to-fuchsia-600",
  ];
  const idx = [...domain].reduce((s, c) => s + c.charCodeAt(0), 0) % fallbackBgs.length;
  return { name: domain.split(".")[0] || "Pengirim", bg: fallbackBgs[idx] };
}

function formatListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (dayDiff === 0) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  if (dayDiff === 1) return "Kemarin";
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDetailDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rowToEmail(row: IncomingEmailRow): Email {
  const meta = metaFor(row.sender_email);
  const subject = row.subject || "(tanpa subjek)";
  const body = row.raw_body_snippet || "";
  return {
    id: row.id,
    sender: meta.name,
    senderEmail: row.sender_email,
    subject,
    time: formatListTime(row.received_at),
    date: formatDetailDate(row.received_at),
    body,
    otp: row.otp_code || "",
    avatarBg: meta.bg,
    avatarText: meta.name.charAt(0),
    isChecked: false,
    isStarred: false,
    isRead: row.is_read,
    isArchived: row.is_archived,
  };
}

export function useFerryMail() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("utama");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
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

  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
  } = useSWR<EmailAccountRow[]>("email-accounts-active", async () => {
    const all = (await getEmailAccounts()) || [];
    return all.filter((a) => a.is_active);
  });

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

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "arsip") {
      return email.isArchived;
    }
    if (email.isArchived) return false;

    if (activeTab === "favorit") {
      return email.isStarred;
    }
    return true;
  });

  const handleCopy = () => {
    if (!selectedEmail) return;
    navigator.clipboard.writeText(selectedEmail.otp);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

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

  const removeEmails = (ids: string[]) => {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedEmail((cur) => (cur && ids.includes(cur.id) ? null : cur));
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
    if (archived) {
      setSelectedEmail((cur) => (cur && ids.includes(cur.id) ? null : cur));
    }
    try {
      await setIncomingEmailsArchived(ids, archived);
      void mutate();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const archiveEmail = async (email: Email) => {
    await setArchived([email.id], true);
  };

  const restoreEmail = async (email: Email) => {
    await setArchived([email.id], false);
  };

  const bulkArchive = async () => {
    if (checkedIds.length === 0) return;
    await setArchived(checkedIds, true);
  };

  return {
    data: {
      emails,
      filteredEmails,
      isLoading,
      isLoadingAccounts,
      accounts,
    },
    uiState: {
      selectedEmail,
      searchQuery,
      copied,
      activeTab,
      allFilteredChecked,
      selectedAccountId,
      isDeleting,
      checkedCount: checkedIds.length,
      openMenu,
    },
    refs: {
      menuRef,
    },
    actions: {
      setSelectedEmail,
      setSearchQuery,
      setActiveTab,
      setSelectedAccountId,
      handleCopy,
      toggleCheck,
      toggleStar,
      toggleAllChecks,
      reloadInbox,
      handleDeleteEmail,
      handleBulkDelete,
      markAsRead,
      setOpenMenu,
      archiveEmail,
      restoreEmail,
      bulkArchive,
    },
  };
}
