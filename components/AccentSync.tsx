"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/player-store";

// Mirrors the mockup's behavior of retinting --accent/--accent2 on
// document root to match whatever track is currently playing.
export function AccentSync() {
  const track = usePlayerStore((s) => s.currentTrack());

  useEffect(() => {
    if (!track) return;
    document.documentElement.style.setProperty("--accent", track.cover_c1);
    document.documentElement.style.setProperty("--accent2", track.cover_c2);
  }, [track]);

  return null;
}
