"use client";

import { CoverArt } from "@/components/CoverArt";
import { useUiStore } from "@/store/ui-store";
import type { Playlist } from "@/types/database";

export function LibraryPlaylistCard({ playlist }: { playlist: Playlist }) {
  const openPlaylist = useUiStore((s) => s.openPlaylist);
  return (
    <button className="lib-card" onClick={() => openPlaylist(playlist.id)}>
      <CoverArt c1={playlist.cover_c1} c2={playlist.cover_c2} pattern={playlist.cover_pattern} />
      <div className="t">{playlist.name}</div>
      <div className="s">{playlist.description}</div>
    </button>
  );
}
