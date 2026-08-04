"use client";

import { useEffect } from "react";
import { createClient } from "../supabase/client";

interface RealtimeConfig {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onPayload: (payload: any) => void;
}

/**
 * Reusable React Hook for Supabase Realtime Postgres Changes Subscription.
 */
export function useRealtimeSubscription({
  table,
  schema = "public",
  event = "*",
  filter,
  onPayload,
}: RealtimeConfig) {
  useEffect(() => {
    const supabase = createClient();

    const channelName = `realtime:${schema}:${table}:${event}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onPayload(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, onPayload]);
}
