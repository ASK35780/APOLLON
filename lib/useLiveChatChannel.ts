"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Mirrors useDirectMessageChannel: Postgres Changes only carries the raw new
// row (no joined sender profile), so on any insert we just refetch the
// whole thread instead of hand-enriching the payload.
export function useLiveChatChannel(liveShowId: string | null, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!liveShowId) return;
    const supabase = createClient();
    const channel = supabase.channel(`live-chat:${liveShowId}`);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `live_show_id=eq.${liveShowId}` },
      () => onChangeRef.current()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveShowId]);
}
