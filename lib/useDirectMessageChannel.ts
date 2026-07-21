"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Realtime Postgres Changes only carries the raw new row (no joined
// shared_track), so on any insert into this conversation we just refetch
// the whole thread instead of trying to hand-enrich the payload.
export function useDirectMessageChannel(conversationKey: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`dm:${conversationKey}`);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_key=eq.${conversationKey}` },
      () => onChangeRef.current()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationKey]);
}
