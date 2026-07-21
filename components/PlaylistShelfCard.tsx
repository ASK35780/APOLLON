"use client";

import { CoverArt } from "@/components/CoverArt";
import { useUiStore } from "@/store/ui-store";
import type { Playlist } from "@/types/database";

// Mirrors ShelfCard's layout (cover + title + subtitle) so playlists look
// like tracks in a shelf — see app/(app)/page.tsx.
export function PlaylistShelfCard({ playlist }: { playlist: Playlist }) {
  const openPlaylist = useUiStore((s) => s.openPlaylist);
  return (
    <button className="shelf-card" onClick={() => openPlaylist(playlist.id)}>
      <CoverArt c1={playlist.cover_c1} c2={playlist.cover_c2} pattern={playlist.cover_pattern} />
      <div className="t">{playlist.name}</div>
      <div className="s">{playlist.description ?? "Playlist"}</div>
    </button>
  );
}
