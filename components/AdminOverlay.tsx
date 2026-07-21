"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseTimedSubtitles } from "@/lib/subtitle-parsing";

type Tab = "applications" | "tracks" | "subtitles" | "delete";

interface PendingApplication {
  id: string;
  artist_name: string;
  genres: string[];
  bio: string | null;
  motivation: string | null;
  applicant: { username: string; display_name: string } | null;
}

interface PendingTrack {
  id: string;
  title: string;
  media_type: "audio" | "video";
  artist: { id: string; name: string; owner_id: string | null } | null;
}

interface PendingSubtitle {
  id: string;
  lines: { timestamp_seconds: number; text: string }[];
  track: { id: string; title: string } | null;
  submitter: { username: string; display_name: string } | null;
}

interface SearchTrackResult {
  id: string;
  title: string;
  artist: { name: string };
}

interface ApplicationEdits {
  artistName?: string;
  genres?: string[];
  bio?: string;
}

interface TrackEdits {
  title?: string;
}

interface SubtitleEdits {
  lines?: { timestamp_seconds: number; text: string }[];
}

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function formatMMSS(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ReasonRow({
  busy,
  onApprove,
  onReject,
}: {
  busy: boolean;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="admin-reason-row">
      <input type="text" placeholder="Motif (obligatoire)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className="admin-approve-btn" disabled={busy || !reason.trim()} onClick={() => onApprove(reason)}>
        Approuver
      </button>
      <button className="admin-reject-btn" disabled={busy || !reason.trim()} onClick={() => onReject(reason)}>
        Refuser
      </button>
    </div>
  );
}

function ApplicationCard({
  app,
  busy,
  onDecide,
}: {
  app: PendingApplication;
  busy: boolean;
  onDecide: (decision: "approve" | "reject", reason: string, edits?: ApplicationEdits) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(app.artist_name);
  const [genresText, setGenresText] = useState(app.genres.join(", "));
  const [bio, setBio] = useState(app.bio ?? "");

  function buildEdits(): ApplicationEdits | undefined {
    if (!editing) return undefined;
    return {
      artistName: name,
      genres: genresText.split(",").map((g) => g.trim()).filter(Boolean),
      bio,
    };
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">{app.artist_name}</div>
      <div className="admin-card-sub">
        @{app.applicant?.username ?? "?"} · {app.genres.join(", ") || "aucun genre"}
      </div>
      {app.bio && <p className="admin-card-text">{app.bio}</p>}
      {app.motivation && <p className="admin-card-text">« {app.motivation} »</p>}

      <button type="button" className="admin-edit-toggle" onClick={() => setEditing((v) => !v)}>
        {editing ? "Annuler la modification" : "Modifier avant de traiter"}
      </button>
      {editing && (
        <div className="admin-edit-fields">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom d'artiste" />
          <input type="text" value={genresText} onChange={(e) => setGenresText(e.target.value)} placeholder="Genres séparés par des virgules" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
        </div>
      )}

      <ReasonRow
        busy={busy}
        onApprove={(reason) => onDecide("approve", reason, buildEdits())}
        onReject={(reason) => onDecide("reject", reason, buildEdits())}
      />
    </div>
  );
}

function TrackCard({
  t,
  busy,
  onDecide,
}: {
  t: PendingTrack;
  busy: boolean;
  onDecide: (decision: "approve" | "reject", reason: string, edits?: TrackEdits) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(t.title);

  function buildEdits(): TrackEdits | undefined {
    return editing ? { title } : undefined;
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">{t.title}</div>
      <div className="admin-card-sub">
        {t.artist?.name ?? "?"} · {t.media_type === "video" ? "vidéo" : "audio"}
      </div>

      <button type="button" className="admin-edit-toggle" onClick={() => setEditing((v) => !v)}>
        {editing ? "Annuler la modification" : "Modifier avant de traiter"}
      </button>
      {editing && (
        <div className="admin-edit-fields">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
        </div>
      )}

      <ReasonRow
        busy={busy}
        onApprove={(reason) => onDecide("approve", reason, buildEdits())}
        onReject={(reason) => onDecide("reject", reason, buildEdits())}
      />
    </div>
  );
}

function SubtitleCard({
  s,
  busy,
  onDecide,
}: {
  s: PendingSubtitle;
  busy: boolean;
  onDecide: (decision: "approve" | "reject", reason: string, edits?: SubtitleEdits) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [linesText, setLinesText] = useState(s.lines.map((l) => `${formatMMSS(l.timestamp_seconds)} ${l.text}`).join("\n"));

  function buildEdits(): SubtitleEdits | undefined {
    if (!editing) return undefined;
    const lines = parseTimedSubtitles(linesText);
    return lines.length > 0 ? { lines } : undefined;
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">{s.track?.title ?? "?"}</div>
      <div className="admin-card-sub">
        proposé par @{s.submitter?.username ?? "?"} · {s.lines.length} lignes
      </div>
      {!editing && (
        <div className="admin-subtitle-preview">
          {s.lines.slice(0, 4).map((l, i) => (
            <div key={i}>
              {formatMMSS(l.timestamp_seconds)} — {l.text}
            </div>
          ))}
          {s.lines.length > 4 && <div>… +{s.lines.length - 4}</div>}
        </div>
      )}

      <button type="button" className="admin-edit-toggle" onClick={() => setEditing((v) => !v)}>
        {editing ? "Annuler la modification" : "Modifier avant de traiter"}
      </button>
      {editing && (
        <div className="admin-edit-fields">
          <textarea
            className="subtitle-textarea"
            value={linesText}
            onChange={(e) => setLinesText(e.target.value)}
            placeholder="0:00 Premier sous-titre&#10;0:12 Deuxième sous-titre…"
          />
        </div>
      )}

      <ReasonRow
        busy={busy}
        onApprove={(reason) => onDecide("approve", reason, buildEdits())}
        onReject={(reason) => onDecide("reject", reason, buildEdits())}
      />
    </div>
  );
}

export function AdminOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [tracks, setTracks] = useState<PendingTrack[]>([]);
  const [subtitles, setSubtitles] = useState<PendingSubtitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteQuery, setDeleteQuery] = useState("");
  const [deleteResults, setDeleteResults] = useState<SearchTrackResult[]>([]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, tracksRes, subsRes] = await Promise.all([
        fetch("/api/admin/applications"),
        fetch("/api/admin/tracks"),
        fetch("/api/admin/subtitles"),
      ]);
      const [appsJson, tracksJson, subsJson] = await Promise.all([appsRes.json(), tracksRes.json(), subsRes.json()]);
      if (!appsRes.ok) throw new Error(appsJson.error ?? "Échec du chargement des candidatures");
      if (!tracksRes.ok) throw new Error(tracksJson.error ?? "Échec du chargement des titres");
      if (!subsRes.ok) throw new Error(subsJson.error ?? "Échec du chargement des sous-titres");
      setApplications(appsJson.applications ?? []);
      setTracks(tracksJson.tracks ?? []);
      setSubtitles(subsJson.submissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function decide(
    kind: "applications" | "tracks" | "subtitles",
    id: string,
    decision: "approve" | "reject",
    reason: string,
    edits?: ApplicationEdits | TrackEdits | SubtitleEdits
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason, edits }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de l'action");
      await loadAll();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'action");
    } finally {
      setBusyId(null);
    }
  }

  async function runDeleteSearch() {
    if (!deleteQuery.trim()) {
      setDeleteResults([]);
      return;
    }
    const res = await fetch(`/api/tracks/search?q=${encodeURIComponent(deleteQuery)}`);
    const json = (await res.json()) as SearchTrackResult[];
    setDeleteResults(Array.isArray(json) ? json : []);
  }

  async function deleteTrack(id: string) {
    const reason = window.prompt("Motif de la suppression (obligatoire) :");
    if (!reason?.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tracks/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de la suppression");
      setDeleteResults((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`admin-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          {BACK_ICON}
        </button>
        <h2>Administration</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === "applications" ? " active" : ""}`} onClick={() => setTab("applications")}>
          Candidatures{applications.length > 0 && <span className="admin-tab-count">{applications.length}</span>}
        </button>
        <button className={`admin-tab${tab === "tracks" ? " active" : ""}`} onClick={() => setTab("tracks")}>
          Titres{tracks.length > 0 && <span className="admin-tab-count">{tracks.length}</span>}
        </button>
        <button className={`admin-tab${tab === "subtitles" ? " active" : ""}`} onClick={() => setTab("subtitles")}>
          Sous-titres{subtitles.length > 0 && <span className="admin-tab-count">{subtitles.length}</span>}
        </button>
        <button className={`admin-tab${tab === "delete" ? " active" : ""}`} onClick={() => setTab("delete")}>
          Supprimer
        </button>
      </div>

      {error && <p className="artist-error">{error}</p>}
      {loading && (
        <p className="edit-section-hint" style={{ marginTop: 10 }}>
          Chargement…
        </p>
      )}

      {tab === "applications" && (
        <>
          {applications.length === 0 && !loading && (
            <p className="edit-section-hint" style={{ marginTop: 10 }}>
              Aucune candidature en attente.
            </p>
          )}
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              busy={busyId === app.id}
              onDecide={(decision, reason, edits) => decide("applications", app.id, decision, reason, edits)}
            />
          ))}
        </>
      )}

      {tab === "tracks" && (
        <>
          {tracks.length === 0 && !loading && (
            <p className="edit-section-hint" style={{ marginTop: 10 }}>
              Aucun titre en attente.
            </p>
          )}
          {tracks.map((t) => (
            <TrackCard key={t.id} t={t} busy={busyId === t.id} onDecide={(decision, reason, edits) => decide("tracks", t.id, decision, reason, edits)} />
          ))}
        </>
      )}

      {tab === "subtitles" && (
        <>
          {subtitles.length === 0 && !loading && (
            <p className="edit-section-hint" style={{ marginTop: 10 }}>
              Aucun sous-titre en attente.
            </p>
          )}
          {subtitles.map((s) => (
            <SubtitleCard
              key={s.id}
              s={s}
              busy={busyId === s.id}
              onDecide={(decision, reason, edits) => decide("subtitles", s.id, decision, reason, edits)}
            />
          ))}
        </>
      )}

      {tab === "delete" && (
        <>
          <p className="edit-section-hint" style={{ marginTop: 10 }}>
            Recherche un titre publié à supprimer (avec justification obligatoire).
          </p>
          <div className="create-group-row">
            <input placeholder="Titre ou artiste…" value={deleteQuery} onChange={(e) => setDeleteQuery(e.target.value)} />
            <button onClick={runDeleteSearch}>Chercher</button>
          </div>
          {deleteResults.map((t) => (
            <div key={t.id} className="admin-card">
              <div className="admin-card-title">{t.title}</div>
              <div className="admin-card-sub">{t.artist?.name}</div>
              <button className="admin-reject-btn" disabled={busyId === t.id} onClick={() => deleteTrack(t.id)}>
                Supprimer
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
