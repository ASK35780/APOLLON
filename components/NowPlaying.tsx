"use client";

import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { HeartIcon } from "@/components/HeartIcon";
import { SubtitleSubmissionForm } from "@/components/SubtitleSubmissionForm";
import { usePlayerStore } from "@/store/player-store";
import { useLikesStore } from "@/store/likes-store";
import { useUiStore } from "@/store/ui-store";
import type { LyricCue } from "@/types/database";

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function NowPlaying({ open, onClose }: { open: boolean; onClose: () => void }) {
  const track = usePlayerStore((s) => s.currentTrack());
  const playing = usePlayerStore((s) => s.playing);
  const elapsed = usePlayerStore((s) => s.elapsed);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const volume = usePlayerStore((s) => s.volume);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const liked = useLikesStore((s) => (track ? s.isLiked(track.id) : false));
  const toggleLike = useLikesStore((s) => s.toggle);
  const openTrackOptions = useUiStore((s) => s.openTrackOptions);

  const [lyrics, setLyrics] = useState<LyricCue[]>([]);
  const [subtitleFormOpen, setSubtitleFormOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    fetch(`/api/tracks/${track.id}/lyrics`)
      .then((res) => res.json())
      .then((data: LyricCue[]) => {
        if (!cancelled) setLyrics(data);
      })
      .catch(() => setLyrics([]));
    return () => {
      cancelled = true;
    };
  }, [track]);

  const activeLyricIndex = (() => {
    let idx = -1;
    lyrics.forEach((line, i) => {
      if (elapsed >= line.timestamp_seconds) idx = i;
    });
    return idx;
  })();

  useEffect(() => {
    if (showLyrics) activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLyricIndex, showLyrics]);

  if (!track) return null;

  const progressPct = (elapsed / track.duration_seconds) * 100;

  return (
    <div className={`now-playing${open ? " open" : ""}`}>
      <div className="np-top">
        <button aria-label="Fermer" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="label">Lecture en cours</div>
        <button aria-label="Plus d'options" onClick={() => track && openTrackOptions(track)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      <div className="np-toggles">
        <button
          className={`np-toggle-btn${shuffle ? " active" : ""}`}
          aria-label="Lecture aléatoire"
          onClick={toggleShuffle}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20L21 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 16v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 15l6 6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Aléatoire
        </button>
        <button
          className={`np-toggle-btn${repeatMode !== "off" ? " active" : ""}`}
          aria-label={
            repeatMode === "off" ? "Activer la répétition" : repeatMode === "all" ? "Répéter la file" : "Répéter le titre"
          }
          onClick={cycleRepeat}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
            {repeatMode === "one" && <text x="12" y="15.5" textAnchor="middle" fontSize="9" stroke="none" fill="currentColor">1</text>}
          </svg>
          {repeatMode === "one" ? "Un titre" : "Boucle"}
        </button>
        <button
          className={`np-toggle-btn${showLyrics ? " active" : ""}`}
          aria-label="Afficher les paroles"
          onClick={toggleLyrics}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="7" y1="8" x2="17" y2="8" />
            <line x1="7" y1="12" x2="13" y2="12" />
          </svg>
          Paroles
        </button>
        <button
          className={`np-toggle-btn${subtitleFormOpen ? " active" : ""}`}
          aria-label="Proposer des sous-titres"
          onClick={() => setSubtitleFormOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sous-titres
        </button>
      </div>

      {subtitleFormOpen && (
        <SubtitleSubmissionForm trackId={track.id} durationSeconds={track.duration_seconds} onClose={() => setSubtitleFormOpen(false)} />
      )}

      {!showLyrics && (
        <div className="np-cover-wrap">
          <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} className="np-cover" />
        </div>
      )}

      {showLyrics && (
        <div className="np-lyrics">
          <div>
            {lyrics.map((line, i) => (
              <div
                key={line.id}
                ref={i === activeLyricIndex ? activeLineRef : undefined}
                className={`lyrics-line${i === activeLyricIndex ? " active" : ""}`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="np-meta">
        <div>
          <div className="t">{track.title}</div>
          <div className="a">{track.artist.name}</div>
        </div>
        <span
          className={`heart${liked ? " active" : ""}`}
          role="button"
          aria-label={liked ? "Retirer des titres likés" : "Liker ce titre"}
          onClick={() => toggleLike(track.id)}
        >
          <HeartIcon filled={liked} c1={track.cover_c1} c2={track.cover_c2} />
        </span>
      </div>

      <div className="np-progress">
        <div
          className="np-bar"
          ref={barRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * track.duration_seconds);
          }}
        >
          <div className="fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="np-times">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(track.duration_seconds)}</span>
        </div>
      </div>

      <div className="np-controls">
        <button className="side" aria-label="Précédent" onClick={prev}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5h2v14H6zM20 5v14l-11-7z" />
          </svg>
        </button>
        <button className="play" aria-label={playing ? "Pause" : "Lecture"} onClick={togglePlay}>
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button className="skip" aria-label="Suivant" onClick={next}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5v14l8-7zM17 5v14h2V5z" />
          </svg>
        </button>
      </div>

      <div className="np-volume">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 9v6h3.5l4.5 4V5l-4.5 4H4z" />
        </svg>
        <div
          className="vol-bar"
          ref={volRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setVolume(((e.clientX - rect.left) / rect.width) * 100);
          }}
        >
          <div className="vol-fill" style={{ width: `${volume}%` }} />
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
