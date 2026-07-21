"use client";

import { useEffect, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { TrackRow } from "@/components/TrackRow";
import { useUiStore } from "@/store/ui-store";
import { useSessionStore } from "@/store/session-store";
import type { Artist, TrackWithArtist } from "@/types/database";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VERIFIED_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 1.9 3-.6 1.1 2.9 2.9 1.1-.6 3 1.9 2.4-1.9 2.4.6 3-2.9 1.1-1.1 2.9-3-.6L12 22l-2.4-1.9-3 .6-1.1-2.9-2.9-1.1.6-3L1.3 12l1.9-2.4-.6-3 2.9-1.1L6.6 2.6l3 .6z" />
    <path d="M8.5 12.3l2.3 2.3 4.5-4.9" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" strokeLinecap="round" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff">
      <path d="M16.5 3c.4 2.2 1.8 3.7 4 4v3c-1.5 0-2.9-.4-4-1.2v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 2 2.7V3h3z" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="#fff" strokeWidth={2} />
      <path d="M10 9l6 3-6 3z" />
    </svg>
  );
}
function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 10.5c3.2-.9 6.8-.6 9.5 1" strokeLinecap="round" />
      <path d="M7.5 13.3c2.6-.7 5.5-.5 7.7.8" strokeLinecap="round" />
      <path d="M8 16c2-.5 4.3-.3 6 .6" strokeLinecap="round" />
    </svg>
  );
}

interface ArtistDetail {
  artist: Artist;
  tracks: TrackWithArtist[];
  followerCount: number;
  isFollowing: boolean;
  verified: boolean;
  monthlyListeners: number;
  totalPlays: number;
}

export function ArtistOverlay() {
  const artistId = useUiStore((s) => s.artistId);
  const close = useUiStore((s) => s.closeArtist);
  const isGuest = useSessionStore((s) => s.isGuest);
  const [detail, setDetail] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    setDetail(null);
    fetch(`/api/artists/${artistId}`)
      .then((r) => r.json())
      .then((d: ArtistDetail) => setDetail(d))
      .finally(() => setLoading(false));
  }, [artistId]);

  async function handleFollowToggle() {
    if (!detail || isGuest || followBusy) return;
    const wasFollowing = detail.isFollowing;
    setFollowBusy(true);
    setDetail({
      ...detail,
      isFollowing: !wasFollowing,
      followerCount: detail.followerCount + (wasFollowing ? -1 : 1),
    });
    try {
      const res = await fetch(`/api/artists/${detail.artist.id}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      setDetail((prev) =>
        prev ? { ...prev, isFollowing: wasFollowing, followerCount: prev.followerCount + (wasFollowing ? 1 : -1) } : prev
      );
    } finally {
      setFollowBusy(false);
    }
  }

  const metaLine = detail
    ? [detail.artist.location, detail.artist.label, detail.artist.founded_year ? `Depuis ${detail.artist.founded_year}` : null]
        .filter(Boolean)
        .join(" · ")
    : "";

  const socialLinks = detail
    ? [
        detail.artist.website && { label: "Site web", href: detail.artist.website, icon: <WebsiteIcon />, bg: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.65 0.15 75))" },
        detail.artist.instagram_url && {
          label: "Instagram",
          href: detail.artist.instagram_url,
          icon: <InstagramIcon />,
          bg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
        },
        detail.artist.tiktok_url && { label: "TikTok", href: detail.artist.tiktok_url, icon: <TikTokIcon />, bg: "linear-gradient(135deg, #00F2EA, #010101, #FF0050)" },
        detail.artist.youtube_url && { label: "YouTube", href: detail.artist.youtube_url, icon: <YoutubeIcon />, bg: "#FF0000" },
        detail.artist.spotify_url && { label: "Spotify", href: detail.artist.spotify_url, icon: <SpotifyIcon />, bg: "#1DB954" },
      ].filter(Boolean)
    : [];

  return (
    <div className={`artist-view stacked-view${artistId ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={close}>
          {BACK_ICON}
        </button>
        <h2>Artiste</h2>
        <div style={{ width: 34 }} />
      </div>

      {loading && <p className="edit-section-hint" style={{ marginTop: 10 }}>Chargement…</p>}

      {detail && (
        <>
          <div className="artist-public-header">
            <div className="artist-public-avatar-wrap">
              <CoverArt
                c1={detail.artist.cover_c1}
                c2={detail.artist.cover_c2}
                pattern={detail.artist.cover_pattern}
                className="artist-public-avatar"
              />
              {detail.verified && (
                <span className="artist-verified-badge" aria-label="Artiste certifié" title="Artiste certifié">
                  {VERIFIED_ICON}
                </span>
              )}
            </div>
            <div className="artist-public-name-row">
              <div className="artist-public-name">{detail.artist.name}</div>
              {detail.verified && <span className="artist-verified-tag">Certifié</span>}
            </div>
            {detail.artist.genres.length > 0 && (
              <div className="artist-public-genres">{detail.artist.genres.join(" · ")}</div>
            )}
            {metaLine && <div className="artist-meta-line">{metaLine}</div>}
            <div className="artist-public-followers">
              {detail.followerCount} abonné{detail.followerCount !== 1 ? "s" : ""}
            </div>
            <button
              className={`artist-follow-btn${detail.isFollowing ? " following" : ""}`}
              disabled={isGuest || followBusy}
              onClick={isGuest ? () => (window.location.href = "/login") : handleFollowToggle}
            >
              {isGuest ? "Se connecter pour suivre" : detail.isFollowing ? "Abonné(e)" : "Suivre"}
            </button>

            <div className="artist-stats-row">
              <div className="artist-stat-card">
                <div className="artist-stat-value">{detail.monthlyListeners}</div>
                <div className="artist-stat-label">Auditeurs mensuels</div>
              </div>
              <div className="artist-stat-card">
                <div className="artist-stat-value">{detail.totalPlays}</div>
                <div className="artist-stat-label">Écoutes</div>
              </div>
              <div className="artist-stat-card">
                <div className="artist-stat-value">{detail.tracks.length}</div>
                <div className="artist-stat-label">Titres</div>
              </div>
            </div>

            {detail.artist.bio && <p className="artist-public-bio">{detail.artist.bio}</p>}

            {socialLinks.length > 0 && (
              <div className="artist-social-row">
                {socialLinks.map((network) =>
                  network ? (
                    <a
                      key={network.label}
                      href={network.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link"
                      aria-label={network.label}
                      title={network.label}
                      style={{ background: network.bg }}
                    >
                      {network.icon}
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>

          <div className="grm-section-title" style={{ marginTop: 22 }}>
            <span>Titres ({detail.tracks.length})</span>
          </div>
          {detail.tracks.length === 0 ? (
            <p className="edit-section-hint">Cet artiste n&apos;a pas encore publié de titre.</p>
          ) : (
            detail.tracks.map((track) => <TrackRow key={track.id} track={track} queue={detail.tracks} />)
          )}
        </>
      )}
    </div>
  );
}
