import { create } from "zustand";
import { persist } from "zustand/middleware";

// Local playback preferences (not account data — no reason to round-trip
// these through Supabase), persisted to localStorage so they survive a
// reload. Actually applied to sound in lib/audio-graph.ts via
// components/PlayerTicker.tsx.

export type EqPreset = "plat" | "basses" | "voix" | "aigus" | "chaleureux";

export const EQ_PRESETS: Record<EqPreset, { label: string; bass: number; mid: number; treble: number }> = {
  plat: { label: "Plat", bass: 0, mid: 0, treble: 0 },
  basses: { label: "Basses renforcées", bass: 8, mid: 1, treble: -1 },
  voix: { label: "Voix claire", bass: -2, mid: 6, treble: 2 },
  aigus: { label: "Aigus éclatants", bass: -1, mid: 0, treble: 7 },
  chaleureux: { label: "Chaleureux", bass: 4, mid: 2, treble: -3 },
};

export const PLAYBACK_RATES = [0.75, 0.9, 1, 1.1, 1.25, 1.5] as const;
export const FADE_DURATIONS = [0, 2, 4, 6] as const;

interface AudioSettingsState {
  eqBass: number; // dB, -12..12
  eqMid: number; // dB, -12..12
  eqTreble: number; // dB, -12..12
  balance: number; // -1 (left) .. 1 (right)
  mono: boolean;
  loudnessNormalization: boolean;
  boost: number; // %, 100..150
  playbackRate: number;
  fadeDuration: number; // seconds, 0 = off

  setEqBand: (band: "bass" | "mid" | "treble", value: number) => void;
  applyPreset: (preset: EqPreset) => void;
  setBalance: (value: number) => void;
  toggleMono: () => void;
  toggleLoudnessNormalization: () => void;
  setBoost: (value: number) => void;
  setPlaybackRate: (value: number) => void;
  setFadeDuration: (value: number) => void;
  resetAll: () => void;
}

const DEFAULTS = {
  eqBass: 0,
  eqMid: 0,
  eqTreble: 0,
  balance: 0,
  mono: false,
  loudnessNormalization: false,
  boost: 100,
  playbackRate: 1,
  fadeDuration: 2,
};

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setEqBand: (band, value) =>
        set({
          [band === "bass" ? "eqBass" : band === "mid" ? "eqMid" : "eqTreble"]: Math.max(-12, Math.min(12, value)),
        }),
      applyPreset: (preset) => {
        const p = EQ_PRESETS[preset];
        set({ eqBass: p.bass, eqMid: p.mid, eqTreble: p.treble });
      },
      setBalance: (value) => set({ balance: Math.max(-1, Math.min(1, value)) }),
      toggleMono: () => set((s) => ({ mono: !s.mono })),
      toggleLoudnessNormalization: () => set((s) => ({ loudnessNormalization: !s.loudnessNormalization })),
      setBoost: (value) => set({ boost: Math.max(100, Math.min(150, value)) }),
      setPlaybackRate: (value) => set({ playbackRate: value }),
      setFadeDuration: (value) => set({ fadeDuration: value }),
      resetAll: () => set(DEFAULTS),
    }),
    { name: "apollon-audio-settings" }
  )
);
