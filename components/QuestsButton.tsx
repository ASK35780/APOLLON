"use client";

import { useUiStore } from "@/store/ui-store";
import { useQuestsStore } from "@/store/quests-store";

export function QuestsButton() {
  const openQuests = useUiStore((s) => s.openQuests);
  const hasClaimable = useQuestsStore((s) => s.quests.some((q) => !q.completed && q.progress >= q.target_count));

  return (
    <button className="notif-bell-btn" aria-label="Quêtes" onClick={openQuests}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      {hasClaimable && <span className="notif-bell-dot" />}
    </button>
  );
}
