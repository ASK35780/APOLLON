"use client";

import { CoverArt } from "@/components/CoverArt";
import { usePlayerStore } from "@/store/player-store";
import { useUiStore } from "@/store/ui-store";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const REMOVE_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function QueueOverlay() {
  const open = useUiStore((s) => s.queueOpen);
  const close = useUiStore((s) => s.closeQueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const jumpTo = usePlayerStore((s) => s.jumpTo);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  const current = queue[currentIndex];
  const upcoming = queue.map((track, index) => ({ track, index })).slice(currentIndex + 1);

  return (
    <div className={`artist-view stacked-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={close}>
          {BACK_ICON}
        </button>
        <h2>File d&apos;attente</h2>
        <div style={{ width: 34 }} />
      </div>

      {!current ? (
        <p className="edit-section-hint" style={{ marginTop: 10 }}>
          Aucune lecture en cours.
        </p>
      ) : (
        <>
          <div className="grm-section-title" style={{ marginTop: 20 }}>
            <span>En cours de lecture</span>
          </div>
          <div className="queue-row current">
            <CoverArt c1={current.cover_c1} c2={current.cover_c2} pattern={current.cover_pattern} />
            <div className="meta">
              <div className="t">{current.title}</div>
              <div className="a">{current.artist.name}</div>
            </div>
          </div>

          <div className="grm-section-title" style={{ marginTop: 22 }}>
            <span>À suivre ({upcoming.length})</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="edit-section-hint">Rien après ce titre — ajoute des morceaux depuis le menu « ... ».</p>
          ) : (
            upcoming.map(({ track, index }) => (
              <div key={`${track.id}-${index}`} className="queue-row" onClick={() => jumpTo(index)}>
                <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} />
                <div className="meta">
                  <div className="t">{track.title}</div>
                  <div className="a">{track.artist.name}</div>
                </div>
                <span
                  className="track-row-remove"
                  role="button"
                  aria-label="Retirer de la file"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(index);
                  }}
                >
                  {REMOVE_ICON}
                </span>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
