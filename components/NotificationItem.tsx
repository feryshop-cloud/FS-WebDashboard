"use client";

import { AlertTriangle, CircleDollarSign, Clock } from "lucide-react";
import type { Notification } from "@/lib/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  userId: string | undefined;
  onMarkAsRead: () => void;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  return `${Math.floor(seconds / 86400)} hari lalu`;
}

export function NotificationItem({
  notification,
  userId,
  onMarkAsRead,
}: NotificationItemProps) {
  const isUnread = userId && !notification.read_by?.includes(userId);
  const isOrderFailed = notification.type === "order_failed";
  const icon = isOrderFailed ? (
    <AlertTriangle className="h-4 w-4" />
  ) : (
    <CircleDollarSign className="h-4 w-4" />
  );
  const iconColor = isOrderFailed ? "text-rose-500" : "text-amber-500";
  const bgColor = isOrderFailed ? "bg-rose-50" : "bg-amber-50";

  return (
    <div
      onClick={onMarkAsRead}
      className={`cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-accent/50 ${isUnread ? "bg-accent/20" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${bgColor}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{notification.title}</p>
            {isUnread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
          {notification.body && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {notification.body}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{getTimeAgo(notification.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
