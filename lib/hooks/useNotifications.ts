"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusher } from "@/lib/pusher";
import useSWR from "swr";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  target_roles: string[];
  read_by: string[];
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState<Notification | null>(null);

  const { data: notifications, mutate } = useSWR<Notification[]>(
    userId ? "/api/notifications" : null,
    fetcher,
    { revalidateOnFocus: true },
  );

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusher();
    if (!pusher) return;

    const channel = pusher.subscribe("admin-notifications");

    channel.bind("new-notification", (data: Notification) => {
      setLatest(data);
      setUnreadCount((prev) => prev + 1);
      mutate();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("admin-notifications");
    };
  }, [userId, mutate]);

  useEffect(() => {
    if (notifications && userId) {
      setUnreadCount(
        notifications.filter((n) => !n.read_by?.includes(userId)).length,
      );
    }
  }, [notifications, userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      mutate();
    },
    [mutate],
  );

  const markAllAsRead = useCallback(async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    mutate();
  }, [mutate]);

  return {
    notifications: notifications || [],
    unreadCount,
    latest,
    markAsRead,
    markAllAsRead,
  };
}
