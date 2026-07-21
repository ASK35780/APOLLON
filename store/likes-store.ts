import { create } from "zustand";
import { useSessionStore } from "@/store/session-store";

interface LikesState {
  likedTrackIds: Set<string>;
  hydrate: (ids: Iterable<string>) => void;
  isLiked: (trackId: string) => boolean;
  toggle: (trackId: string) => Promise<void>;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedTrackIds: new Set(),

  hydrate: (ids) => set({ likedTrackIds: new Set(ids) }),

  isLiked: (trackId) => get().likedTrackIds.has(trackId),

  toggle: async (trackId) => {
    if (!useSessionStore.getState().userId) {
      // Guests can browse everything, but liking requires an account —
      // send them to sign in/up instead of silently no-op-ing.
      window.location.href = "/login";
      return;
    }

    const before = get().likedTrackIds;
    const optimistic = new Set(before);
    const wasLiked = optimistic.has(trackId);
    if (wasLiked) optimistic.delete(trackId);
    else optimistic.add(trackId);
    set({ likedTrackIds: optimistic });

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (!res.ok) throw new Error("Request failed");
    } catch {
      // Roll back on failure (e.g. not authenticated, network error).
      set({ likedTrackIds: before });
    }
  },
}));
