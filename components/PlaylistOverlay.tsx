"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { TrackRow } from "@/components/TrackRow";
import { usePlayerStore } from "@/store/player-store";
import { useUiStore } from "@/store/ui-store";
import { useSessionStore } from "@/store/session-store";
import type { PlaylistWithTracks } from "@/types/database";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PLAY_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function PlaylistOverlay() {
  const router = useRouter();
  const playlistId = useUiStore((s) => s.playlistId);
  const close = useUiStore((s) => s.closePlaylist);
  const userId = useSessionStore((s) => s.userId);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
    if (!playlistId) return;
    setLoading(true);
    setPlaylist(null);
    setNotFound(false);
    fetch(`/api/playlists/${playlistId}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return;
        }
        const d = (await r.json()) as { playlist: PlaylistWithTracks };
        setPlaylist(d.playlist);
      })
      .finally(() => setLoading(false));
  }, [playlistId]);

  async function handleRemoveTrack(trackId: string) {
    if (!playlist) return;
    const prev = playlist;
    setPlaylist({ ...playlist, tracks: playlist.tracks.filter((t) => t.id !== trackId) });
    const res = await fetch(`/api/playlists/${playlist.id}/tracks/${trackId}`, { method: "DELETE" });
    if (!res.ok) setPlaylist(prev);
  }

  async function handleDelete() {
    if (!playlist || deleting) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" });
      if (res.ok) {
        close();
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const isOwner = playlist && userId === playlist.owner_id;

  return (
    <div className={`artist-view stacked-view${playlistId ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={close}>
          {BACK_ICON}
        </button>
        <h2>Playlist</h2>
        <div style={{ width: 34 }} />
      </div>

      {loading && <p className="edit-section-hint" style={{ marginTop: 10 }}>Chargement…</p>}
      {notFound && (
        <p className="edit-section-hint" style={{ marginTop: 10 }}>
          Cette playlist est introuvable ou n&apos;est pas accessible.
        </p>
      )}

      {playlist && (
        <>
          <div className="artist-public-header">
            <CoverArt
              c1={playlist.cover_c1}
              c2={playlist.cover_c2}
              pattern={playlist.cover_pattern}
              className="artist-public-avatar"
            />
            <div className="artist-public-name">{playlist.name}</div>
            {playlist.description && <p className="artist-public-bio">{playlist.description}</p>}
            <div className="artist-public-followers">
              {playlist.tracks.length} titre{playlist.tracks.length !== 1 ? "s" : ""}
            </div>
            {playlist.tracks.length > 0 && (
              <button className="artist-follow-btn" onClick={() => playQueue(playlist.tracks, 0)}>
                {PLAY_ICON} Lecture
              </button>
            )}
            {isOwner && !confirmingDelete && (
              <button className="playlist-delete-btn" disabled={deleting} onClick={handleDelete}>
                Supprimer la playlist
              </button>
            )}
            {isOwner && confirmingDelete && (
              <div className="playlist-delete-confirm">
                <span>Supprimer « {playlist.name} » ?</span>
                <div className="playlist-delete-confirm-actions">
                  <button className="playlist-delete-btn" disabled={deleting} onClick={handleDelete}>
                    {deleting ? "Suppression…" : "Confirmer"}
                  </button>
                  <button
                    className="playlist-delete-cancel-btn"
                    disabled={deleting}
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grm-section-title" style={{ marginTop: 22 }}>
            <span>Titres</span>
          </div>
          {playlist.tracks.length === 0 ? (
            <p className="edit-section-hint">Aucun titre pour l&apos;instant — ajoute-en depuis le menu « ... » d&apos;un titre.</p>
          ) : (
            playlist.tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                queue={playlist.tracks}
                onRemove={isOwner ? () => handleRemoveTrack(track.id) : undefined}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
