import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export type BadgeTone =
  | "neutral"
  | "emerald"
  | "blue"
  | "amber"
  | "orange"
  | "rose"
  | "red"
  | "violet"
  | "slate";

export const TONE_CLASS: Record<BadgeTone, { badge: string; icon: string }> = {
  neutral: {
    badge: "bg-muted text-muted-foreground ring-1 ring-border/50",
    icon: "text-muted-foreground",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
    icon: "text-emerald-500",
  },
  blue: {
    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50",
    icon: "text-blue-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50",
    icon: "text-amber-500",
  },
  orange: {
    badge: "bg-orange-50 text-orange-600 ring-1 ring-orange-200/50",
    icon: "text-orange-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50",
    icon: "text-rose-500",
  },
  red: {
    badge: "bg-red-50 text-red-600 ring-1 ring-red-200/50",
    icon: "text-red-500",
  },
  violet: {
    badge: "bg-violet-50 text-violet-600 ring-1 ring-violet-200/50",
    icon: "text-violet-500",
  },
  slate: {
    badge: "bg-slate-800 text-white ring-1 ring-slate-700",
    icon: "text-slate-300",
  },
};

export interface StatusBadgeProps {
  label: ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export function StatusBadge({
  label,
  tone = "neutral",
  icon: Icon,
  iconClassName,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-xs font-medium",
        TONE_CLASS[tone].badge,
        className,
      )}
    >
      {Icon && <Icon className={cn("h-3 w-3", TONE_CLASS[tone].icon, iconClassName)} />}
      {label}
    </span>
  );
}

const DEAL_TONE: Record<string, BadgeTone> = {
  PAID: "emerald",
  COMPLETED: "emerald",
  BOOKED: "amber",
  LIMITED_ACCESS: "violet",
  CANCELLED: "rose",
  CANCELLED_BY_BUYER: "rose",
  CANCELLED_BY_SELLER: "rose",
  REFUND_PARTIAL: "orange",
  REFUND_FULL: "orange",
  PROBLEM: "red",
};

const DEAL_LABEL: Record<string, string> = {
  PAID: "Lunas",
  COMPLETED: "Selesai",
  BOOKED: "Booking",
  LIMITED_ACCESS: "Akses Terbatas",
  DRAFT: "Draft",
  CANCELLED: "Cancel",
  CANCELLED_BY_BUYER: "Batal (Buyer)",
  CANCELLED_BY_SELLER: "Batal (Seller)",
  REFUND_PARTIAL: "Refund Sebagian",
  REFUND_FULL: "Refund Penuh",
  PROBLEM: "Bermasalah",
};

export function DealStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge label={DEAL_LABEL[status] ?? status} tone={DEAL_TONE[status] ?? "neutral"} />
  );
}