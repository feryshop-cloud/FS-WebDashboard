import { DealStatus, InventoryStatus, StockStatus } from "@/types/database";

type BadgeStatus = StockStatus | DealStatus | InventoryStatus;

export function StatusBadge({ status }: { status: BadgeStatus }) {
  let badgeStyle = "";
  let label: string = status;

  switch (status) {
    case "AVAILABLE":
      badgeStyle = "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50";
      label = "Tersedia";
      break;
    case "BOOKED":
      badgeStyle = "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50";
      label = "Booking";
      break;
    case "LIMITED_ACCESS":
      badgeStyle = "bg-purple-50 text-purple-600 ring-1 ring-purple-200/50";
      label = "Akses Terbatas";
      break;
    case "SOLD":
      badgeStyle = "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50";
      label = "Terjual";
      break;
    case "UNPOSTED":
      badgeStyle = "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
      label = "Belum Diposting";
      break;
    case "DRAFT":
      badgeStyle = "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
      label = "Draft";
      break;
    case "PAID":
      badgeStyle = "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50";
      label = "Lunas";
      break;
    case "COMPLETED":
      badgeStyle = "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50";
      label = "Selesai";
      break;
    case "CANCELLED_BY_BUYER":
    case "CANCELLED_BY_SELLER":
      badgeStyle = "bg-gray-100 text-gray-500 ring-1 ring-gray-200/50";
      label = "Cancel";
      break;
    case "REFUND_PARTIAL":
    case "REFUND_FULL":
      badgeStyle = "bg-orange-50 text-orange-600 ring-1 ring-orange-200/50";
      label = "Refund";
      break;
    case "PROBLEM":
      badgeStyle = "bg-red-50 text-red-600 ring-1 ring-red-200/50";
      label = "Bermasalah";
      break;
    case "ON_HOLD":
      badgeStyle = "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
      label = "On Hold";
      break;
    case "PROBLEM_ACTION":
      badgeStyle = "bg-red-50 text-red-600 ring-1 ring-red-200/50";
      label = "Bermasalah (Tindak Lanjut)";
      break;
    case "PROBLEM_PERMANENT":
      badgeStyle = "bg-rose-100 text-rose-700 ring-1 ring-rose-300";
      label = "Bermasalah (Permanen)";
      break;
    case "CANCELLED":
      badgeStyle = "bg-gray-100 text-gray-500 ring-1 ring-gray-200/50";
      label = "Cancel";
      break;
    default:
      badgeStyle = "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
      label = status;
  }

  return (
    <span
      className={`inline-flex items-center rounded-[10px] px-2.5 py-1 text-xs font-medium ${badgeStyle}`}
    >
      {label}
    </span>
  );
}
