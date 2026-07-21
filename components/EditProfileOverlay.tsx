"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { CoverArt } from "@/components/CoverArt";
import type { BadgeWithStatus } from "@/lib/queries/profile";
import type { Profile, TrackWithArtist } from "@/types/database";

const MAX_FEATURED_BADGES = 6;
const MAX_FEATURED_TRACKS = 6;
const MAX_BIO = 240;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const CAMERA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13.5" r="3.5" />
  </svg>
);

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const REMOVE_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface EditProfileOverlayProps {
  profile: Profile;
  badges: BadgeWithStatus[];
  featuredTracks: TrackWithArtist[];
  open: boolean;
  onClose: () => void;
}

export function EditProfileOverlay({ profile, badges, featuredTracks, open, onClose }: EditProfileOverlayProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identitySuccess, setIdentitySuccess] = useState(false);

  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioSuccess, setBioSuccess] = useState(false);

  const [selectedBadgeIds, setSelectedBadgeIds] = useState<Set<string>>(
    () => new Set(badges.filter((b) => b.featured).map((b) => b.id))
  );
  const [badgeStatus, setBadgeStatus] = useState<string | null>(null);

  const [featured, setFeatured] = useState<TrackWithArtist[]>(featuredTracks);
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState<TrackWithArtist[]>([]);
  const [tracksStatus, setTracksStatus] = useState<string | null>(null);

  useEffect(() => {
    const q = trackQuery.trim();
    if (!q) {
      setTrackResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: TrackWithArtist[]) => setTrackResults(data));
    }, 250);
    return () => clearTimeout(handle);
  }, [trackQuery]);

  async function handlePhotoChange(kind: "avatar" | "banner", file: File | undefined) {
    if (!file) return;
    setPhotoError(null);

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choisis un fichier image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setPhotoError("Image trop lourde (5 Mo maximum).");
      return;
    }

    const setUploading = kind === "avatar" ? setAvatarUploading : setBannerUploading;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/profile/${kind}`, { method: "POST", body: formData });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Échec de l'envoi");

      if (kind === "avatar") setAvatarUrl(json.url);
      else setBannerUrl(json.url);
      router.refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveIdentity() {
    setIdentityError(null);
    setIdentitySuccess(false);
    setIdentitySaving(true);
    try {
      const res = await fetch("/api/profile/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de la mise à jour");
      setIdentitySuccess(true);
      router.refresh();
    } catch (err) {
      setIdentityError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setIdentitySaving(false);
    }
  }

  async function handleSaveBio() {
    setBioError(null);
    setBioSuccess(false);
    setBioSaving(true);
    try {
      const res = await fetch("/api/profile/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de la mise à jour");
      setBioSuccess(true);
      router.refresh();
    } catch (err) {
      setBioError(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setBioSaving(false);
    }
  }

  async function toggleBadge(badgeId: string) {
    const wasSelected = selectedBadgeIds.has(badgeId);
    if (!wasSelected && selectedBadgeIds.size >= MAX_FEATURED_BADGES) {
      setBadgeStatus(`Tu peux en choisir ${MAX_FEATURED_BADGES} maximum.`);
      return;
    }

    const before = selectedBadgeIds;
    const next = new Set(before);
    if (wasSelected) next.delete(badgeId);
    else next.add(badgeId);
    setSelectedBadgeIds(next);
    setBadgeStatus(null);

    try {
      const res = await fetch("/api/profile/featured-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds: Array.from(next) }),
      });
      if (!res.ok) throw new Error("save failed");
      router.refresh();
    } catch {
      setSelectedBadgeIds(before);
      setBadgeStatus("La sauvegarde a échoué, réessaie.");
    }
  }

  async function saveFeaturedTracks(next: TrackWithArtist[], before: TrackWithArtist[]) {
    try {
      const res = await fetch("/api/profile/featured-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds: next.map((t) => t.id) }),
      });
      if (!res.ok) throw new Error("save failed");
      router.refresh();
    } catch {
      setFeatured(before);
      setTracksStatus("La sauvegarde a échoué, réessaie.");
    }
  }

  async function addFeaturedTrack(track: TrackWithArtist) {
    if (featured.some((t) => t.id === track.id)) return;
    if (featured.length >= MAX_FEATURED_TRACKS) {
      setTracksStatus(`Tu peux en choisir ${MAX_FEATURED_TRACKS} maximum.`);
      return;
    }
    const before = featured;
    const next = [...featured, track];
    setFeatured(next);
    setTrackPickerOpen(false);
    setTrackQuery("");
    setTrackResults([]);
    setTracksStatus(null);
    await saveFeaturedTracks(next, before);
  }

  async function removeFeaturedTrack(trackId: string) {
    const before = featured;
    const next = featured.filter((t) => t.id !== trackId);
    setFeatured(next);
    setTracksStatus(null);
    await saveFeaturedTracks(next, before);
  }

  const unlockedBadges = badges.filter((b) => b.unlocked);

  return (
    <div className={`edit-profile-view${open ? " open" : ""}`}>
      <div className="edit-profile-top">
        <button aria-label="Fermer" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Modifier le profil</h2>
        <div style={{ width: 34 }} />
      </div>

      <button
        className="edit-banner-wrap"
        onClick={() => bannerInputRef.current?.click()}
        aria-label="Modifier la bannière"
      >
        <ProfilePhoto url={bannerUrl} c1="oklch(0.14 0.012 280)" c2="oklch(0.78 0.16 75)" pattern="b" alt="" />
        <div className="edit-photo-hint">
          {CAMERA_ICON}
          {bannerUploading ? "Envoi…" : "Modifier la bannière"}
        </div>
        <div className="edit-photo-badge">{CAMERA_ICON}</div>
      </button>
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handlePhotoChange("banner", e.target.files?.[0])}
      />

      <div className="edit-identity-row">
        <button
          className="edit-avatar-wrap"
          onClick={() => avatarInputRef.current?.click()}
          aria-label="Modifier la photo de profil"
        >
          <ProfilePhoto url={avatarUrl} c1="oklch(0.6 0.14 55)" c2="oklch(0.65 0.15 75)" pattern="e" alt="" />
          <div className="edit-photo-hint">{avatarUploading ? "…" : CAMERA_ICON}</div>
          <div className="edit-photo-badge">{CAMERA_ICON}</div>
        </button>
      </div>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handlePhotoChange("avatar", e.target.files?.[0])}
      />

      <div className="edit-profile-body">
        {photoError && (
          <p className="edit-upload-status error" style={{ marginBottom: 18 }}>
            {photoError}
          </p>
        )}

        <div className="edit-section-title">Pseudo</div>
        <p className="edit-section-hint">Ton pseudo principal, affiché en grand, et ton identifiant (@…), unique.</p>
        <div className="artist-field">
          <label>Pseudo principal</label>
          <input
            type="text"
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ton nom affiché"
          />
        </div>
        <div className="artist-field">
          <label>Identifiant (pseudo secondaire)</label>
          <input
            type="text"
            maxLength={40}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="identifiant"
          />
        </div>
        {identityError && <p className="edit-upload-status error">{identityError}</p>}
        {identitySuccess && <p className="edit-upload-status success">Pseudo mis à jour.</p>}
        <button
          className="artist-submit-btn"
          style={{ marginTop: 12 }}
          disabled={
            identitySaving ||
            !displayName.trim() ||
            !username.trim() ||
            (displayName === profile.display_name && username === profile.username)
          }
          onClick={handleSaveIdentity}
        >
          {identitySaving ? "Enregistrement…" : "Enregistrer le pseudo"}
        </button>

        <div className="edit-section-title" style={{ marginTop: 28 }}>
          Bio
        </div>
        <p className="edit-section-hint">
          Une courte présentation affichée sur ton profil ({bio.length}/{MAX_BIO}).
        </p>
        <div className="artist-field">
          <textarea
            maxLength={MAX_BIO}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Parle un peu de toi…"
          />
        </div>
        {bioError && <p className="edit-upload-status error">{bioError}</p>}
        {bioSuccess && <p className="edit-upload-status success">Bio mise à jour.</p>}
        <button
          className="artist-submit-btn"
          style={{ marginTop: 12 }}
          disabled={bioSaving || bio === (profile.bio ?? "")}
          onClick={handleSaveBio}
        >
          {bioSaving ? "Enregistrement…" : "Enregistrer la bio"}
        </button>

        <div className="edit-section-title" style={{ marginTop: 28 }}>
          Badges affichés sur le profil
        </div>
        <p className="edit-section-hint">
          Choisis jusqu&apos;à {MAX_FEATURED_BADGES} badges débloqués à mettre en avant ({selectedBadgeIds.size}/
          {MAX_FEATURED_BADGES} sélectionnés).
        </p>
        {badgeStatus && <p className="edit-upload-status error">{badgeStatus}</p>}

        {unlockedBadges.length === 0 ? (
          <p className="edit-section-hint" style={{ marginTop: 14 }}>
            Débloque des badges pour pouvoir les mettre en avant ici.
          </p>
        ) : (
          <div className="edit-badges-grid">
            {unlockedBadges.map((badge) => {
              const selected = selectedBadgeIds.has(badge.id);
              return (
                <button
                  key={badge.id}
                  className={`edit-badge-card${selected ? " selected" : ""}`}
                  onClick={() => toggleBadge(badge.id)}
                >
                  {selected && <div className="edit-badge-check">{CHECK_ICON}</div>}
                  <div className="badge-icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/badges/badge-${badge.slug}.png`} alt={badge.name} />
                  </div>
                  <div className="t">{badge.name}</div>
                </button>
              );
            })}
          </div>
        )}

        <div className="edit-section-title" style={{ marginTop: 28 }}>
          Titres préférés
        </div>
        <p className="edit-section-hint">
          Choisis jusqu&apos;à {MAX_FEATURED_TRACKS} titres à afficher sur ton profil ({featured.length}/
          {MAX_FEATURED_TRACKS} sélectionnés).
        </p>
        {tracksStatus && <p className="edit-upload-status error">{tracksStatus}</p>}

        {featured.length > 0 && (
          <div className="pft-list" style={{ marginTop: 10 }}>
            {featured.map((track) => (
              <div key={track.id} className="pft-item" style={{ cursor: "default" }}>
                <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} className="pft-cover" />
                <div className="meta">
                  <div className="t">{track.title}</div>
                  <div className="a">{track.artist.name}</div>
                </div>
                <button
                  aria-label={`Retirer ${track.title}`}
                  onClick={() => removeFeaturedTrack(track.id)}
                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4 }}
                >
                  {REMOVE_ICON}
                </button>
              </div>
            ))}
          </div>
        )}

        {featured.length < MAX_FEATURED_TRACKS &&
          (trackPickerOpen ? (
            <div style={{ marginTop: 10 }}>
              <div className="search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  placeholder="Chercher un titre…"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  autoFocus
                />
              </div>
              {trackResults.length > 0 && (
                <div className="grm-search-results">
                  {trackResults
                    .filter((t) => !featured.some((f) => f.id === t.id))
                    .map((t) => (
                      <button key={t.id} className="grm-search-result" onClick={() => addFeaturedTrack(t)}>
                        <CoverArt c1={t.cover_c1} c2={t.cover_c2} pattern={t.cover_pattern} className="cover" />
                        <div className="meta">
                          <div className="t">{t.title}</div>
                          <div className="a">{t.artist.name}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <button className="admin-edit-toggle" style={{ marginTop: 10 }} onClick={() => setTrackPickerOpen(true)}>
              + Ajouter un titre
            </button>
          ))}
      </div>
    </div>
  );
}
