import { create } from "zustand";
import type { TrackWithArtist } from "@/types/database";

interface UiState {
  liveOpen: boolean;
  profileOpen: boolean;
  questsOpen: boolean;
  artistId: string | null;
  playlistId: string | null;
  queueOpen: boolean;
  trackOptionsTrack: TrackWithArtist | null;
  openLive: () => void;
  closeLive: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  openQuests: () => void;
  closeQuests: () => void;
  openArtist: (artistId: string) => void;
  closeArtist: () => void;
  openPlaylist: (playlistId: string) => void;
  closePlaylist: () => void;
  openQueue: () => void;
  closeQueue: () => void;
  openTrackOptions: (track: TrackWithArtist) => void;
  closeTrackOptions: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  liveOpen: false,
  profileOpen: false,
  questsOpen: false,
  artistId: null,
  playlistId: null,
  queueOpen: false,
  trackOptionsTrack: null,
  openLive: () => set({ liveOpen: true }),
  closeLive: () => set({ liveOpen: false }),
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  openQuests: () => set({ questsOpen: true }),
  closeQuests: () => set({ questsOpen: false }),
  openArtist: (artistId) => set({ artistId }),
  closeArtist: () => set({ artistId: null }),
  openPlaylist: (playlistId) => set({ playlistId }),
  closePlaylist: () => set({ playlistId: null }),
  openQueue: () => set({ queueOpen: true }),
  closeQueue: () => set({ queueOpen: false }),
  openTrackOptions: (track) => set({ trackOptionsTrack: track }),
  closeTrackOptions: () => set({ trackOptionsTrack: null }),
}));
