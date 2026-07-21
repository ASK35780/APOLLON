import { create } from "zustand";
import type { QuestWithProgress } from "@/types/database";

interface QuestsState {
  quests: QuestWithProgress[];
  setQuests: (quests: QuestWithProgress[]) => void;
  markCompleted: (questId: string) => void;
}

export const useQuestsStore = create<QuestsState>((set) => ({
  quests: [],
  setQuests: (quests) => set({ quests }),
  markCompleted: (questId) =>
    set((state) => ({
      // everCompleted also flips here (not just `completed`) so a freshly
      // claimed quest lights up its constellation star immediately, without
      // waiting on a full server refetch — see lib/constellations.ts.
      quests: state.quests.map((q) => (q.id === questId ? { ...q, completed: true, everCompleted: true } : q)),
    })),
}));
