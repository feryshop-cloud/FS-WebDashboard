"use client";

import { useEffect } from "react";
import { createClient } from "../supabase/client";

interface RealtimeConfig<T = Record<string, unknown>> {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onPayload: (payload: T) => void;
}

/**
 * Reusable React Hook for Supabase Realtime Postgres Changes Subscription.
 */
export function useRealtimeSubscription<T = Record<string, unknown>>({
  table,
  schema = "public",
  event = "*",
  filter,
  onPayload,
}: RealtimeConfig<T>) {
  useEffect(() => {
    const supabase = createClient();

    const channelName = `realtime:${schema}:${table}:${event}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          onPayload(payload as T);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, event, filter, onPayload]);
}
