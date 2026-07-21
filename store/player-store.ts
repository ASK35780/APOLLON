import { create } from "zustand";
import type { TrackWithArtist } from "@/types/database";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  // `queue` is the actual playback order (what currentIndex indexes into).
  // `originalQueue` is the unshuffled order — source of truth for restoring
  // sequence when shuffle turns off, and for splicing in playNext/addToQueue
  // insertions at a stable position. When shuffle is off the two are kept
  // identical.
  queue: TrackWithArtist[];
  originalQueue: TrackWithArtist[];
  currentIndex: number;
  playing: boolean;
  elapsed: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  showLyrics: boolean;
  // Set by seek() when the user explicitly scrubs; the real <audio> element
  // (see components/PlayerTicker.tsx) consumes it once and clears it, so it
  // doesn't fight with the timeupdate-driven elapsed updates.
  seekRequest: number | null;

  currentTrack: () => TrackWithArtist | null;
  playQueue: (queue: TrackWithArtist[], startIndex: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setElapsed: (seconds: number) => void;
  clearSeekRequest: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLyrics: () => void;
  setVolume: (percent: number) => void;
  addToQueue: (track: TrackWithArtist) => void;
  playNext: (track: TrackWithArtist) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
}

function shuffleExceptFirst(tracks: TrackWithArtist[]): TrackWithArtist[] {
  if (tracks.length <= 1) return tracks;
  const first = tracks[0]!;
  const rest = tracks.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = rest[i]!;
    rest[i] = rest[j]!;
    rest[j] = tmp;
  }
  return [first, ...rest];
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  originalQueue: [],
  currentIndex: -1,
  playing: false,
  elapsed: 0,
  shuffle: false,
  repeatMode: "off",
  volume: 70,
  showLyrics: false,
  seekRequest: null,

  currentTrack: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  playQueue: (queue, startIndex) =>
    set((state) => {
      if (!state.shuffle) {
        return { queue, originalQueue: queue, currentIndex: startIndex, elapsed: 0, playing: true };
      }
      // Keep the requested track first so playback starts on the track the
      // user actually clicked, then shuffle the rest of this new queue.
      const reordered = [queue[startIndex], ...queue.filter((_, i) => i !== startIndex)].filter(Boolean) as TrackWithArtist[];
      return { queue: shuffleExceptFirst(reordered), originalQueue: queue, currentIndex: 0, elapsed: 0, playing: true };
    }),

  togglePlay: () =>
    set((state) => {
      if (state.currentIndex < 0 && state.queue.length > 0) {
        return { currentIndex: 0, elapsed: 0, playing: true };
      }
      return { playing: !state.playing };
    }),

  next: () =>
    set((state) => {
      if (state.queue.length === 0) return state;
      const rawNext = state.currentIndex + 1;
      if (rawNext < state.queue.length) {
        return { currentIndex: rawNext, elapsed: 0, playing: true };
      }
      // Ran past the end of the queue.
      if (state.repeatMode === "off") {
        return { playing: false };
      }
      return { currentIndex: 0, elapsed: 0, playing: true };
    }),

  prev: () =>
    set((state) => {
      if (state.queue.length === 0) return state;
      // Same track: no track-id change, so nothing else resets the audio
      // element's position — ask for an explicit seek back to 0.
      if (state.elapsed > 4) return { elapsed: 0, seekRequest: 0 };
      const rawPrev = state.currentIndex - 1;
      if (rawPrev >= 0) return { currentIndex: rawPrev, elapsed: 0, playing: true };
      if (state.repeatMode === "off") return { elapsed: 0, seekRequest: 0 };
      return { currentIndex: state.queue.length - 1, elapsed: 0, playing: true };
    }),

  seek: (seconds) => set({ elapsed: seconds, seekRequest: seconds }),
  setElapsed: (seconds) => set({ elapsed: seconds }),
  clearSeekRequest: () => set({ seekRequest: null }),

  toggleShuffle: () =>
    set((state) => {
      const nextShuffle = !state.shuffle;
      const current = state.queue[state.currentIndex];
      if (!nextShuffle) {
        const restoredIndex = current ? state.originalQueue.findIndex((t) => t.id === current.id) : -1;
        return { shuffle: false, queue: state.originalQueue, currentIndex: Math.max(0, restoredIndex) };
      }
      if (!current) return { shuffle: true };
      const rest = state.originalQueue.filter((t) => t.id !== current.id);
      return { shuffle: true, queue: shuffleExceptFirst([current, ...rest]), currentIndex: 0 };
    }),

  cycleRepeat: () =>
    set((state) => ({
      repeatMode: state.repeatMode === "off" ? "all" : state.repeatMode === "all" ? "one" : "off",
    })),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  setVolume: (percent) => set({ volume: Math.max(0, Math.min(100, percent)) }),

  addToQueue: (track) =>
    set((state) => ({
      queue: [...state.queue, track],
      originalQueue: [...state.originalQueue, track],
    })),

  playNext: (track) =>
    set((state) => {
      const newQueue = [...state.queue];
      newQueue.splice(state.currentIndex + 1, 0, track);
      const current = state.queue[state.currentIndex];
      const origIdx = current ? state.originalQueue.findIndex((t) => t.id === current.id) : -1;
      const newOriginal = [...state.originalQueue];
      newOriginal.splice(origIdx + 1, 0, track);
      return { queue: newQueue, originalQueue: newOriginal };
    }),

  removeFromQueue: (index) =>
    set((state) => {
      if (index === state.currentIndex || index < 0 || index >= state.queue.length) return state;
      const track = state.queue[index];
      const newQueue = state.queue.filter((_, i) => i !== index);
      const newOriginal = track ? state.originalQueue.filter((t) => t.id !== track.id) : state.originalQueue;
      const newCurrentIndex = index < state.currentIndex ? state.currentIndex - 1 : state.currentIndex;
      return { queue: newQueue, originalQueue: newOriginal, currentIndex: newCurrentIndex };
    }),

  // Jump straight to a track already in the queue (Queue view) — distinct
  // from playQueue(), which replaces the whole queue.
  jumpTo: (index) =>
    set((state) => (index >= 0 && index < state.queue.length ? { currentIndex: index, elapsed: 0, playing: true } : state)),
}));
