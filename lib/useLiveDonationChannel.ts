"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Unlike chat, a donation insert carries everything the UI needs (nothing —
// it's just a +1), so the callback increments a counter directly instead of
// refetching.
export function useLiveDonationChannel(liveShowId: string | null, onDonation: () => void) {
  const onDonationRef = useRef(onDonation);
  onDonationRef.current = onDonation;

  useEffect(() => {
    if (!liveShowId) return;
    const supabase = createClient();
    const channel = supabase.channel(`live-donations:${liveShowId}`);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "live_show_donations", filter: `live_show_id=eq.${liveShowId}` },
      () => onDonationRef.current()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveShowId]);
}
