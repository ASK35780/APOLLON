"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session-store";

export function SessionHydrator({ userId }: { userId: string | null }) {
  const setUserId = useSessionStore((s) => s.setUserId);

  useEffect(() => {
    setUserId(userId);
    // Only ever needs to run once, on mount, with the server-fetched snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
