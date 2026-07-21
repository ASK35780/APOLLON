"use client";

import { CoverArt } from "@/components/CoverArt";
import { usePlayerStore } from "@/store/player-store";
import type { TrackWithArtist } from "@/types/database";

export function ShelfCard({ track, queue }: { track: TrackWithArtist; queue: TrackWithArtist[] }) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const index = queue.findIndex((t) => t.id === track.id);

  return (
    <button className="shelf-card" onClick={() => playQueue(queue, index)}>
      <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} />
      <div className="t">{track.title}</div>
      <div className="s">{track.artist.name}</div>
    </button>
  );
}
