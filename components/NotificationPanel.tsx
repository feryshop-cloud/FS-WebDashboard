"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/lib/hooks/useNotifications";

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onClose: () => void;
  userId: string | undefined;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  onClose,
  userId,
}: NotificationPanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-96 rounded-xl border border-border bg-card shadow-lg z-50">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({unreadCount} baru)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                userId={userId}
                onMarkAsRead={() => markAsRead(n.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
