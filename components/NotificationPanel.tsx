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
      <div className="border-border bg-card absolute top-full right-0 z-50 mt-2 w-96 rounded-xl border shadow-lg">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="text-muted-foreground text-xs">({unreadCount} baru)</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground px-4 py-8 text-center text-sm">
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
