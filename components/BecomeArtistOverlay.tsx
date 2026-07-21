"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { createClient } from "@/lib/supabase/client";
import { parseSubtitles, type SubtitleFormat } from "@/lib/subtitle-parsing";
import type { Artist, ArtistStats } from "@/types/database";

function readMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const isVideo = file.name.toLowerCase().endsWith(".mp4");
    const el = document.createElement(isVideo ? "video" : "audio");
    const url = URL.createObjectURL(file);
    el.preload = "metadata";
    el.src = url;
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire ce fichier"));
    };
  });
}

const GENRES = ["Pop", "Rock", "Hip-Hop", "Électro", "Jazz", "Classique", "R&B", "Reggae", "Metal", "Folk", "Ambient", "Latino"];

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PENCIL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 20h9" strokeLinecap="round" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CAMERA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

interface BecomeArtistOverlayProps {
  open: boolean;
  onClose: () => void;
  artist: Artist | null;
  stats: ArtistStats | null;
}

export function BecomeArtistOverlay({ open, onClose, artist, stats }: BecomeArtistOverlayProps) {
  const router = useRouter();

  // ---- Candidature form (no artist profile yet) ----
  const [artistName, setArtistName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  function toggleGenre(g: string) {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  async function submitApplication() {
    if (!artistName.trim() || submitting) return;
    setSubmitting(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/artist/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName, genres: Array.from(selectedGenres), bio, motivation }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de l'envoi");
      router.refresh();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Dashboard (artist profile exists) ----
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(artist?.name ?? "");
  const [editBio, setEditBio] = useState(artist?.bio ?? "");
  const [editGenres, setEditGenres] = useState<Set<string>>(new Set(artist?.genres ?? []));
  const [editLocation, setEditLocation] = useState(artist?.location ?? "");
  const [editLabel, setEditLabel] = useState(artist?.label ?? "");
  const [editFoundedYear, setEditFoundedYear] = useState(artist?.founded_year ? String(artist.founded_year) : "");
  const [editWebsite, setEditWebsite] = useState(artist?.website ?? "");
  const [editInstagram, setEditInstagram] = useState(artist?.instagram_url ?? "");
  const [editTiktok, setEditTiktok] = useState(artist?.tiktok_url ?? "");
  const [editYoutube, setEditYoutube] = useState(artist?.youtube_url ?? "");
  const [editSpotify, setEditSpotify] = useState(artist?.spotify_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);

  const trackFileInputRef = useRef<HTMLInputElement>(null);
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackFile, setNewTrackFile] = useState<File | null>(null);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [trackUploadError, setTrackUploadError] = useState<string | null>(null);
  const [trackUploadSuccess, setTrackUploadSuccess] = useState<string | null>(null);
  const [subtitleFormat, setSubtitleFormat] = useState<SubtitleFormat>("simple");
  const [subtitleText, setSubtitleText] = useState("");

  function toggleEditGenre(g: string) {
    setEditGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function openEditing() {
    if (!artist) return;
    setEditName(artist.name);
    setEditBio(artist.bio ?? "");
    setEditGenres(new Set(artist.genres));
    setEditLocation(artist.location ?? "");
    setEditLabel(artist.label ?? "");
    setEditFoundedYear(artist.founded_year ? String(artist.founded_year) : "");
    setEditWebsite(artist.website ?? "");
    setEditInstagram(artist.instagram_url ?? "");
    setEditTiktok(artist.tiktok_url ?? "");
    setEditYoutube(artist.youtube_url ?? "");
    setEditSpotify(artist.spotify_url ?? "");
    setDashError(null);
    setEditing(true);
  }

  async function saveProfile() {
    if (!editName.trim() || savingProfile) return;
    const trimmedYear = editFoundedYear.trim();
    if (trimmedYear && !/^\d{4}$/.test(trimmedYear)) {
      setDashError("Année invalide (format attendu : AAAA)");
      return;
    }
    setSavingProfile(true);
    setDashError(null);
    try {
      const res = await fetch("/api/artist/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          genres: Array.from(editGenres),
          location: editLocation,
          label: editLabel,
          foundedYear: trimmedYear ? Number(trimmedYear) : null,
          website: editWebsite,
          instagramUrl: editInstagram,
          tiktokUrl: editTiktok,
          youtubeUrl: editYoutube,
          spotifyUrl: editSpotify,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de la sauvegarde");
      router.refresh();
      setEditing(false);
    } catch (err) {
      setDashError(err instanceof Error ? err.message : "Échec de la sauvegarde");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePhotoChange(kind: "avatar" | "banner", file: File | undefined) {
    if (!file) return;
    setDashError(null);
    if (!file.type.startsWith("image/")) {
      setDashError("Choisis un fichier image.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/artist/${kind}`, { method: "POST", body: formData });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Échec de l'envoi");
      router.refresh();
    } catch (err) {
      setDashError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // The file itself goes straight from the browser to Supabase Storage (a
  // Next.js API route body is capped well below song/video file sizes) —
  // the server only ever sees the resulting metadata.
  async function uploadTrack() {
    if (!artist || !newTrackFile || !newTrackTitle.trim() || uploadingTrack) return;
    setUploadingTrack(true);
    setTrackUploadError(null);
    setTrackUploadSuccess(null);
    try {
      const lowerName = newTrackFile.name.toLowerCase();
      const isMp4 = lowerName.endsWith(".mp4");
      const isMp3 = lowerName.endsWith(".mp3");
      if (!isMp4 && !isMp3) {
        throw new Error("Formats acceptés : .mp3 ou .mp4");
      }
      const mediaType = isMp4 ? "video" : "audio";
      const durationSeconds = await readMediaDuration(newTrackFile);

      const supabase = createClient();
      const ext = isMp4 ? "mp4" : "mp3";
      const path = `${artist.owner_id}/tracks/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("track-audio").upload(path, newTrackFile, {
        contentType: newTrackFile.type || (isMp4 ? "video/mp4" : "audio/mpeg"),
      });
      if (uploadErr) throw new Error(uploadErr.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("track-audio").getPublicUrl(path);

      const subtitles = subtitleText.trim() ? parseSubtitles(subtitleFormat, subtitleText, durationSeconds) : undefined;

      const res = await fetch("/api/artist/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTrackTitle, audioUrl: publicUrl, durationSeconds, mediaType, subtitles }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de l'envoi");

      setNewTrackTitle("");
      setNewTrackFile(null);
      setSubtitleText("");
      if (trackFileInputRef.current) trackFileInputRef.current.value = "";
      setTrackUploadSuccess("Titre envoyé, en attente de validation par l'équipe Apollon.");
      router.refresh();
    } catch (err) {
      setTrackUploadError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploadingTrack(false);
    }
  }

  return (
    <div className={`artist-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          {BACK_ICON}
        </button>
        <h2>{artist ? "Espace artiste" : "Devenir artiste"}</h2>
        <div style={{ width: 34 }} />
      </div>

      {!artist ? (
        <>
          <p className="edit-section-hint" style={{ marginTop: 6 }}>
            Crée ton profil artiste pour publier ta musique sur Apollon et suivre tes statistiques d&apos;écoute.
          </p>

          <div className="artist-field">
            <label>Nom d&apos;artiste</label>
            <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Ton nom de scène" />
          </div>

          <div className="artist-field">
            <label>Genres musicaux</label>
            <div className="artist-genre-grid">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`artist-genre-chip${selectedGenres.has(g) ? " selected" : ""}`}
                  onClick={() => toggleGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="artist-field">
            <label>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Parle un peu de toi et de ta musique…" />
          </div>

          <div className="artist-field">
            <label>Pourquoi veux-tu devenir artiste sur Apollon ?</label>
            <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Optionnel" />
          </div>

          {applyError && <p className="artist-error">{applyError}</p>}

          <button className="artist-submit-btn" disabled={!artistName.trim() || submitting} onClick={submitApplication}>
            {submitting ? "Envoi…" : "Envoyer ma candidature"}
          </button>
        </>
      ) : (
        <>
          <div className="artist-header-card">
            <button className="artist-banner-wrap" onClick={() => bannerInputRef.current?.click()} aria-label="Modifier la bannière">
              <ProfilePhoto url={artist.banner_url} c1="oklch(0.14 0.012 280)" c2="oklch(0.78 0.16 75)" pattern="b" alt="" />
              <div className="edit-photo-badge">{CAMERA_ICON}</div>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handlePhotoChange("banner", e.target.files?.[0])}
            />

            <div className="artist-header-body">
              <button className="artist-avatar-wrap" onClick={() => avatarInputRef.current?.click()} aria-label="Modifier la photo d'artiste">
                <ProfilePhoto url={artist.avatar_url} c1="oklch(0.6 0.14 55)" c2="oklch(0.65 0.15 75)" pattern="e" alt="" />
                <div className="edit-photo-badge">{CAMERA_ICON}</div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handlePhotoChange("avatar", e.target.files?.[0])}
              />

              <div className="artist-name-row">
                <div className="artist-name">{artist.name}</div>
                <button className="artist-edit-btn" onClick={() => (editing ? setEditing(false) : openEditing())} aria-label="Modifier">
                  {editing ? CLOSE_ICON : PENCIL_ICON}
                </button>
              </div>

              {artist.genres.length > 0 && (
                <div className="artist-genres-row">
                  {artist.genres.map((g) => (
                    <span key={g} className="artist-genre-tag">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {!editing && (artist.location || artist.label || artist.founded_year) && (
                <div className="artist-meta-line">
                  {[artist.location, artist.label, artist.founded_year ? `Depuis ${artist.founded_year}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              )}
              {artist.bio && !editing && <p className="artist-bio">{artist.bio}</p>}
              {uploadingPhoto && (
                <p className="edit-upload-status" style={{ marginTop: 8 }}>
                  Envoi de la photo…
                </p>
              )}
            </div>
          </div>

          {artist.status !== "approved" && (
            <div className={`artist-status-banner ${artist.status}`}>
              {artist.status === "pending"
                ? "Ton profil artiste est en attente de validation par l'équipe Apollon — il n'est pas encore visible publiquement."
                : "Ta candidature a été refusée. Contacte-nous pour plus d'informations."}
            </div>
          )}

          {editing && (
            <>
              <div className="artist-field">
                <label>Nom d&apos;artiste</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="artist-field">
                <label>Genres musicaux</label>
                <div className="artist-genre-grid">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`artist-genre-chip${editGenres.has(g) ? " selected" : ""}`}
                      onClick={() => toggleEditGenre(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="artist-field">
                <label>Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>

              <div className="artist-tracks-title">Infos professionnelles</div>
              <div className="artist-field-row">
                <div className="artist-field">
                  <label>Localisation</label>
                  <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Ville, pays" />
                </div>
                <div className="artist-field">
                  <label>Année de début</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFoundedYear}
                    onChange={(e) => setEditFoundedYear(e.target.value)}
                    placeholder="2020"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="artist-field">
                <label>Label / structure</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Indépendant, nom du label…" />
              </div>
              <div className="artist-field">
                <label>Site web</label>
                <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://…" />
              </div>
              <div className="artist-field">
                <label>Instagram</label>
                <input type="url" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} placeholder="https://instagram.com/…" />
              </div>
              <div className="artist-field">
                <label>TikTok</label>
                <input type="url" value={editTiktok} onChange={(e) => setEditTiktok(e.target.value)} placeholder="https://tiktok.com/@…" />
              </div>
              <div className="artist-field">
                <label>YouTube</label>
                <input type="url" value={editYoutube} onChange={(e) => setEditYoutube(e.target.value)} placeholder="https://youtube.com/@…" />
              </div>
              <div className="artist-field">
                <label>Spotify</label>
                <input type="url" value={editSpotify} onChange={(e) => setEditSpotify(e.target.value)} placeholder="https://open.spotify.com/artist/…" />
              </div>

              {dashError && <p className="artist-error">{dashError}</p>}
              <button className="artist-submit-btn" disabled={!editName.trim() || savingProfile} onClick={saveProfile}>
                {savingProfile ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </>
          )}

          <div className="artist-stats-row">
            <div className="artist-stat-card">
              <div className="artist-stat-value">{stats?.totalPlays ?? 0}</div>
              <div className="artist-stat-label">Lectures</div>
            </div>
            <div className="artist-stat-card">
              <div className="artist-stat-value">{stats?.totalLikes ?? 0}</div>
              <div className="artist-stat-label">Likes</div>
            </div>
            <div className="artist-stat-card">
              <div className="artist-stat-value">{stats?.totalListeners ?? 0}</div>
              <div className="artist-stat-label">Auditeurs</div>
            </div>
          </div>

          <div className="artist-tracks-title">Ajouter un titre</div>
          <div className="artist-field">
            <label>Titre</label>
            <input type="text" value={newTrackTitle} onChange={(e) => setNewTrackTitle(e.target.value)} placeholder="Nom du morceau" />
          </div>
          <div className="artist-field">
            <label>Fichier (.mp3 ou .mp4)</label>
            <input
              ref={trackFileInputRef}
              type="file"
              accept=".mp3,.mp4,audio/mpeg,video/mp4"
              onChange={(e) => setNewTrackFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="artist-field">
            <label>Sous-titres (optionnel)</label>
            <div className="subtitle-format-row">
              <button
                type="button"
                className={`subtitle-format-btn${subtitleFormat === "simple" ? " selected" : ""}`}
                onClick={() => setSubtitleFormat("simple")}
              >
                Texte simple
              </button>
              <button
                type="button"
                className={`subtitle-format-btn${subtitleFormat === "timed" ? " selected" : ""}`}
                onClick={() => setSubtitleFormat("timed")}
              >
                Ligne par ligne (mm:ss)
              </button>
            </div>
            <textarea
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              placeholder={
                subtitleFormat === "simple"
                  ? "Une ligne par sous-titre, réparties automatiquement sur la durée du titre…"
                  : "0:00 Premier sous-titre\n0:12 Deuxième sous-titre…"
              }
            />
          </div>
          {trackUploadError && <p className="artist-error">{trackUploadError}</p>}
          {trackUploadSuccess && (
            <p className="edit-upload-status success" style={{ marginTop: 8 }}>
              {trackUploadSuccess}
            </p>
          )}
          <button
            className="artist-submit-btn"
            disabled={!newTrackTitle.trim() || !newTrackFile || uploadingTrack}
            onClick={uploadTrack}
          >
            {uploadingTrack ? "Envoi…" : "Envoyer le titre"}
          </button>

          <div className="artist-tracks-title">Tes titres</div>
          {stats && stats.tracks.length > 0 ? (
            stats.tracks.map((t) => (
              <div key={t.track_id} className="artist-track-row">
                <div>
                  <div className="artist-track-name">{t.title}</div>
                  {t.status !== "approved" && (
                    <div className={`artist-track-status ${t.status}`}>{t.status === "pending" ? "En attente" : "Refusé"}</div>
                  )}
                </div>
                <div className="artist-track-numbers">
                  {t.plays} lectures · {t.likes} likes
                </div>
              </div>
            ))
          ) : (
            <p className="edit-section-hint" style={{ marginTop: 10 }}>
              Tu n&apos;as pas encore de titre en ligne.
            </p>
          )}
        </>
      )}
    </div>
  );
}
