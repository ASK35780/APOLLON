"use client";

import { CoverArt } from "@/components/CoverArt";
import { HeartIcon } from "@/components/HeartIcon";
import { usePlayerStore } from "@/store/player-store";
import { useLikesStore } from "@/store/likes-store";
import { useUiStore } from "@/store/ui-store";
import type { TrackWithArtist } from "@/types/database";

interface TrackRowProps {
  track: TrackWithArtist;
  queue: TrackWithArtist[];
  // Shown as a trailing "✕" when set (e.g. inside a playlist you own) —
  // spans, not nested <button>s, same trick the heart toggle already uses,
  // since a <button> can't contain another <button>.
  onRemove?: () => void;
}

export function TrackRow({ track, queue, onRemove }: TrackRowProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack());
  const playQueue = usePlayerStore((s) => s.playQueue);
  const liked = useLikesStore((s) => s.isLiked(track.id));
  const toggleLike = useLikesStore((s) => s.toggle);
  const openTrackOptions = useUiStore((s) => s.openTrackOptions);
  const openArtist = useUiStore((s) => s.openArtist);

  const isPlaying = currentTrack?.id === track.id;
  const index = queue.findIndex((t) => t.id === track.id);

  return (
    <button className={`track-row${isPlaying ? " playing" : ""}`} onClick={() => playQueue(queue, index)}>
      <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} />
      <div className="meta">
        <div className="t">{track.title}</div>
        <div
          className="a"
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            openArtist(track.artist.id);
          }}
        >
          {track.artist.name}
        </div>
      </div>
      <span
        className={`heart${liked ? " active" : ""}`}
        role="button"
        aria-label={liked ? "Retirer des titres likés" : "Liker ce titre"}
        onClick={(e) => {
          e.stopPropagation();
          toggleLike(track.id);
        }}
      >
        <HeartIcon filled={liked} c1={track.cover_c1} c2={track.cover_c2} />
      </span>
      <span
        className="track-row-kebab"
        role="button"
        aria-label="Plus d'options"
        onClick={(e) => {
          e.stopPropagation();
          openTrackOptions(track);
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </span>
      {onRemove && (
        <span
          className="track-row-remove"
          role="button"
          aria-label="Retirer de la playlist"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
