"use client";

import { useLikesStore } from "@/store/likes-store";
import { usePlayerStore } from "@/store/player-store";
import type { TrackWithArtist } from "@/types/database";

interface LikedBannerProps {
  // When provided, the banner becomes the "Titres likés" auto-playlist:
  // clicking it plays every currently-liked track from this catalog, live —
  // liking/unliking anywhere in the app updates the queue immediately
  // since it's derived from useLikesStore rather than a stored playlist.
  allTracks?: TrackWithArtist[];
  // Smaller, stacked-icon layout for sitting side by side with another
  // banner (see app/(app)/page.tsx) instead of taking the full width.
  compact?: boolean;
  // Shrunk-down version of the default full-width row (icon still left,
  // text still right) — see app/(app)/library/page.tsx.
  mini?: boolean;
}

export function LikedBanner({ allTracks, compact = false, mini = false }: LikedBannerProps) {
  const likedTrackIds = useLikesStore((s) => s.likedTrackIds);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const likedCount = likedTrackIds.size;

  const content = (
    <>
      <div className="ic">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="oklch(0.14 0.012 280)">
          <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.6 4.4 5.1c2.3-1.2 4.8-.4 6.2 1.4l1.4 1.8 1.4-1.8c1.4-1.8 3.9-2.6 6.2-1.4 2.8 1.5 3.4 4.9 1.7 7.7C18.7 16.7 12 21 12 21z" />
        </svg>
      </div>
      <div>
        <div className="t">Titres likés</div>
        <div className="s">
          {likedCount === 0 ? "Aucun titre liké pour l'instant" : `${likedCount} morceau${likedCount === 1 ? "" : "x"}`}
        </div>
      </div>
    </>
  );

  const className = `liked-banner${compact ? " compact" : ""}${mini ? " mini" : ""}`;

  if (!allTracks) {
    return <div className={className}>{content}</div>;
  }

  const likedTracks = allTracks.filter((t) => likedTrackIds.has(t.id));

  return (
    <button
      className={className}
      style={{ width: "100%", border: "none", textAlign: "left", font: "inherit", cursor: likedTracks.length ? "pointer" : "default" }}
      disabled={likedTracks.length === 0}
      onClick={() => playQueue(likedTracks, 0)}
    >
      {content}
    </button>
  );
}
