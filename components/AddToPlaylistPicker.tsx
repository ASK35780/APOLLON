"use client";

import { useEffect, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import type { Playlist, TrackWithArtist } from "@/types/database";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function AddToPlaylistPicker({
  track,
  onBack,
  onDone,
}: {
  track: TrackWithArtist;
  onBack: () => void;
  onDone: () => void;
}) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((d) => {
        setPlaylists(d.playlists ?? []);
        setLoading(false);
      });
  }, []);

  async function handleAdd(playlistId: string) {
    setStatus(null);
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: track.id }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setStatus(json.error ?? "Échec de l'ajout");
      return;
    }
    setStatus("Ajouté à la playlist !");
    setTimeout(onDone, 500);
  }

  async function handleCreateAndAdd() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = (await res.json()) as { playlist?: Playlist; error?: string };
      if (!res.ok || !json.playlist) {
        setStatus(json.error ?? "Échec de la création");
        return;
      }
      await handleAdd(json.playlist.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="sheet-header-row">
        <button aria-label="Retour" onClick={onBack}>
          {BACK_ICON}
        </button>
        <div className="sheet-title">Ajouter à une playlist</div>
        <div style={{ width: 28 }} />
      </div>

      {status && <p className="edit-upload-status success">{status}</p>}

      {loading ? (
        <p className="edit-section-hint">Chargement…</p>
      ) : playlists.length === 0 ? (
        <p className="edit-section-hint">Tu n&apos;as pas encore de playlist — crées-en une ci-dessous.</p>
      ) : (
        <div className="sheet-playlist-list">
          {playlists.map((p) => (
            <button key={p.id} className="sheet-playlist-row" onClick={() => handleAdd(p.id)}>
              <CoverArt c1={p.cover_c1} c2={p.cover_c2} pattern={p.cover_pattern} className="sheet-playlist-cover" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="sheet-new-playlist">
        <input
          placeholder="Nouvelle playlist…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={60}
        />
        <button disabled={!newName.trim() || creating} onClick={handleCreateAndAdd}>
          Créer
        </button>
      </div>
    </>
  );
}
