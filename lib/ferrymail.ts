import type { IncomingEmailRow } from "@/app/actions/incoming-emails";

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

export function metaFor(email: string): { name: string; bg: string } {
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

export function formatListTime(iso: string): string {
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
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatDetailDate(iso: string): string {
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

export function rowToEmail(row: IncomingEmailRow): Email {
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
