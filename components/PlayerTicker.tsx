"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useAudioSettingsStore } from "@/store/audio-settings-store";
import { buildAudioGraph, setMonoActive, setCompressorActive, type AudioGraph } from "@/lib/audio-graph";

// Headless component: owns the single real <audio> element that drives
// playback for the whole app (mini player + now playing share the same
// store, so they stay in sync automatically). Kept separate from
// MiniPlayer/NowPlaying so the element exists exactly once.
//
// The element's output is routed through a Web Audio processing chain (see
// lib/audio-graph.ts) so the "Lecture et son" settings are real DSP.
export function PlayerTicker() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const graphRef = useRef<AudioGraph | null>(null);
  if (audioRef.current === null && typeof window !== "undefined") {
    audioRef.current = new Audio();
    // Required for the Web Audio graph below: Chrome silently outputs
    // zeroes from a MediaElementAudioSourceNode built on a cross-origin
    // element that wasn't loaded with CORS ("tainted" media) — track files
    // are served from Supabase Storage, a different origin than the app.
    // Storage's public bucket sends Access-Control-Allow-Origin, so this is
    // safe (verified: a cross-origin fetch() in `cors` mode against a real
    // track URL resolves instead of rejecting).
    audioRef.current.crossOrigin = "anonymous";
    graphRef.current = buildAudioGraph(audioRef.current);
  }
  // Fires once per track, when playback enters its last `fadeDuration`
  // seconds — see the timeupdate handler below.
  const fadeOutFiredRef = useRef(false);

  const track = usePlayerStore((s) => s.currentTrack());
  const playing = usePlayerStore((s) => s.playing);
  const volume = usePlayerStore((s) => s.volume);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const setElapsed = usePlayerStore((s) => s.setElapsed);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);
  const next = usePlayerStore((s) => s.next);

  const eqBass = useAudioSettingsStore((s) => s.eqBass);
  const eqMid = useAudioSettingsStore((s) => s.eqMid);
  const eqTreble = useAudioSettingsStore((s) => s.eqTreble);
  const balance = useAudioSettingsStore((s) => s.balance);
  const mono = useAudioSettingsStore((s) => s.mono);
  const loudnessNormalization = useAudioSettingsStore((s) => s.loudnessNormalization);
  const boost = useAudioSettingsStore((s) => s.boost);
  const playbackRate = useAudioSettingsStore((s) => s.playbackRate);
  const fadeDuration = useAudioSettingsStore((s) => s.fadeDuration);

  // Load the current track's source whenever the track itself changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeOutFiredRef.current = false;
    if (!track) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }
    audio.src = track.audio_url;
    audio.currentTime = 0;
    audio.playbackRate = useAudioSettingsStore.getState().playbackRate;
    setPreservesPitch(audio, true);

    const graph = graphRef.current;
    if (graph) {
      const currentFade = useAudioSettingsStore.getState().fadeDuration;
      graph.fadeGain.gain.cancelScheduledValues(graph.ctx.currentTime);
      if (currentFade > 0) {
        graph.fadeGain.gain.setValueAtTime(0, graph.ctx.currentTime);
        graph.fadeGain.gain.linearRampToValueAtTime(1, graph.ctx.currentTime + currentFade);
      } else {
        graph.fadeGain.gain.setValueAtTime(1, graph.ctx.currentTime);
      }
    }

    if (usePlayerStore.getState().playing) {
      graph?.ctx.resume().catch(() => {});
      audio.play().catch(() => {});
    }
    // Logs a play for the artist dashboard's "lectures" stat.
    fetch(`/api/tracks/${track.id}/play`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // Play/pause without reloading the source.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) {
      graphRef.current?.ctx.resume().catch(() => {});
      audio.play().catch(() => {});
    } else audio.pause();
  }, [playing, track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = Math.max(0, Math.min(100, volume)) / 100;
  }, [volume]);

  // ---- Sound settings: applied live via the Web Audio graph ----
  useEffect(() => {
    if (graphRef.current) graphRef.current.bass.gain.value = eqBass;
  }, [eqBass]);
  useEffect(() => {
    if (graphRef.current) graphRef.current.mid.gain.value = eqMid;
  }, [eqMid]);
  useEffect(() => {
    if (graphRef.current) graphRef.current.treble.gain.value = eqTreble;
  }, [eqTreble]);
  useEffect(() => {
    if (graphRef.current) graphRef.current.panner.pan.value = balance;
  }, [balance]);
  useEffect(() => {
    if (graphRef.current) graphRef.current.preamp.gain.value = boost / 100;
  }, [boost]);
  useEffect(() => {
    if (graphRef.current) setMonoActive(graphRef.current, mono);
  }, [mono]);
  useEffect(() => {
    if (graphRef.current) setCompressorActive(graphRef.current, loudnessNormalization);
  }, [loudnessNormalization]);
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
      setPreservesPitch(audio, true);
    }
  }, [playbackRate]);
  useEffect(() => {
    // Turning fades off mid-track shouldn't leave the gain stuck partway
    // through a ramp.
    const graph = graphRef.current;
    if (graph && fadeDuration <= 0) {
      graph.fadeGain.gain.cancelScheduledValues(graph.ctx.currentTime);
      graph.fadeGain.gain.setValueAtTime(1, graph.ctx.currentTime);
    }
  }, [fadeDuration]);

  // An explicit user seek (progress bar click, or the "restart current
  // track" case in prev()) — applied once, then cleared.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekRequest === null) return;
    audio.currentTime = seekRequest;
    clearSeekRequest();
  }, [seekRequest, clearSeekRequest]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTimeUpdate() {
      setElapsed(audio!.currentTime);

      // Fade-out: ramp to silence over the last `fadeDuration` seconds of
      // the track, once per track. Fade-in is scheduled up front when the
      // track loads (see the track-change effect above).
      const graph = graphRef.current;
      const currentTrack = usePlayerStore.getState().currentTrack();
      const { fadeDuration: fd } = useAudioSettingsStore.getState();
      if (!graph || !currentTrack || fd <= 0 || fadeOutFiredRef.current) return;
      const remaining = currentTrack.duration_seconds - audio!.currentTime;
      if (remaining > 0 && remaining <= fd) {
        fadeOutFiredRef.current = true;
        const g = graph.fadeGain.gain;
        g.cancelScheduledValues(graph.ctx.currentTime);
        g.setValueAtTime(g.value, graph.ctx.currentTime);
        g.linearRampToValueAtTime(0, graph.ctx.currentTime + Math.max(remaining, 0.05));
      }
    }
    function handleEnded() {
      // repeat-one only affects this natural end-of-track event — a manual
      // skip (next()) always advances regardless of repeat mode, handled
      // inside next() itself for the off/all distinction.
      if (repeatMode === "one") {
        audio!.currentTime = 0;
        audio!.play().catch(() => {});
      } else {
        next();
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeatMode, next, setElapsed]);

  return null;
}

// Vendor-prefixed on older WebKit/Gecko — without this, changing
// playbackRate also shifts pitch, which reads as broken, not "faster".
function setPreservesPitch(audio: HTMLAudioElement, value: boolean) {
  const a = audio as HTMLAudioElement & {
    preservesPitch?: boolean;
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };
  a.preservesPitch = value;
  a.mozPreservesPitch = value;
  a.webkitPreservesPitch = value;
}
