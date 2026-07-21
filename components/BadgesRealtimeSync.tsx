"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Staff can grant/revoke badges for any account from the separate Gestion
// Apollon admin site (a different app, same Supabase project). This keeps
// the signed-in user's badge list live here without a manual reload when
// that happens — router.refresh() re-runs the server fetch in
// app/(app)/layout.tsx (getBadgesWithUnlockStatus), which flows straight
// into ProfileOverlay's featured badges + "Mes badges" grid.
export function BadgesRealtimeSync({ userId }: { userId: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`user-badges:${userId}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_badges", filter: `user_id=eq.${userId}` },
      () => router.refresh()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
