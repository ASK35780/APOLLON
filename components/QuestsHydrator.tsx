"use client";

import { useEffect } from "react";
import { useQuestsStore } from "@/store/quests-store";
import type { QuestWithProgress } from "@/types/database";

export function QuestsHydrator({ quests }: { quests: QuestWithProgress[] }) {
  const setQuests = useQuestsStore((s) => s.setQuests);

  useEffect(() => {
    setQuests(quests);
    // Only ever needs to run once, on mount, with the server-fetched snapshot
    // — after that the store is updated locally as quests get claimed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
