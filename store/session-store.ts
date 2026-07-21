import { create } from "zustand";

interface SessionState {
  userId: string | null;
  isGuest: boolean;
  setUserId: (userId: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  isGuest: true,
  setUserId: (userId) => set({ userId, isGuest: userId === null }),
}));
