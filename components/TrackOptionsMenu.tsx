"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useUiStore } from "@/store/ui-store";
import { AddToPlaylistPicker } from "@/components/AddToPlaylistPicker";

const ICONS = {
  next: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
      <path d="M18 15l3-3-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  queueAdd: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M4 12h10M4 18h10" strokeLinecap="round" />
      <path d="M19 15v6M16 18h6" strokeLinecap="round" />
    </svg>
  ),
  playlist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  artist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
    </svg>
  ),
  queueList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 6h18M3 12h18M3 18h12" strokeLinecap="round" />
    </svg>
  ),
};

export function TrackOptionsMenu() {
  const track = useUiStore((s) => s.trackOptionsTrack);
  const close = useUiStore((s) => s.closeTrackOptions);
  const openArtist = useUiStore((s) => s.openArtist);
  const openQueue = useUiStore((s) => s.openQueue);
  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const [view, setView] = useState<"menu" | "playlist">("menu");

  useEffect(() => {
    if (track) setView("menu");
  }, [track]);

  return (
    <div className={`sheet${track ? " open" : ""}`}>
      <div className="sheet-backdrop" onClick={close} />
      <div className="sheet-card">
        {track && view === "menu" && (
          <>
            <div className="sheet-track-header">
              <div className="t">{track.title}</div>
              <div className="a">{track.artist.name}</div>
            </div>
            <button
              className="sheet-action"
              onClick={() => {
                playNext(track);
                close();
              }}
            >
              <span className="sheet-action-icon">{ICONS.next}</span>
              Lire ensuite
            </button>
            <button
              className="sheet-action"
              onClick={() => {
                addToQueue(track);
                close();
              }}
            >
              <span className="sheet-action-icon">{ICONS.queueAdd}</span>
              Ajouter à la file d&apos;attente
            </button>
            <button className="sheet-action" onClick={() => setView("playlist")}>
              <span className="sheet-action-icon">{ICONS.playlist}</span>
              Ajouter à une playlist
            </button>
            <button
              className="sheet-action"
              onClick={() => {
                openArtist(track.artist.id);
                close();
              }}
            >
              <span className="sheet-action-icon">{ICONS.artist}</span>
              Voir l&apos;artiste
            </button>
            <button
              className="sheet-action"
              onClick={() => {
                openQueue();
                close();
              }}
            >
              <span className="sheet-action-icon">{ICONS.queueList}</span>
              Voir la file d&apos;attente
            </button>
            <button className="sheet-cancel" onClick={close}>
              Annuler
            </button>
          </>
        )}
        {track && view === "playlist" && (
          <AddToPlaylistPicker track={track} onBack={() => setView("menu")} onDone={close} />
        )}
      </div>
    </div>
  );
}
