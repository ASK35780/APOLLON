"use client";

import { useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { NowPlaying } from "@/components/NowPlaying";
import { usePlayerStore } from "@/store/player-store";

export function MiniPlayer() {
  const [open, setOpen] = useState(false);
  const track = usePlayerStore((s) => s.currentTrack());
  const playing = usePlayerStore((s) => s.playing);
  const elapsed = usePlayerStore((s) => s.elapsed);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);

  if (!track) return null;

  const progressPct = (elapsed / track.duration_seconds) * 100;

  return (
    <>
      <div className="mini-player" onClick={() => setOpen(true)}>
        <div className="progress" style={{ width: `${progressPct}%` }} />
        <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} />
        <div className="meta">
          <div className="t">{track.title}</div>
          <div className="a">{track.artist.name}</div>
        </div>
        <div className="ctrl">
          <button
            aria-label={playing ? "Pause" : "Lecture"}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            aria-label="Suivant"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5v14l8-7zM17 5v14h2V5z" />
            </svg>
          </button>
        </div>
      </div>
      <NowPlaying open={open} onClose={() => setOpen(false)} />
    </>
  );
}
