"use client";

import { useEffect } from "react";
import { useLikesStore } from "@/store/likes-store";

export function LikesHydrator({ likedTrackIds }: { likedTrackIds: string[] }) {
  const hydrate = useLikesStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(likedTrackIds);
    // Only ever needs to run once, on mount, with the server-fetched snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
