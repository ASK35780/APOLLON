"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { EditProfileOverlay } from "@/components/EditProfileOverlay";
import { NotificationsOverlay } from "@/components/NotificationsOverlay";
import { SettingsOverlay } from "@/components/SettingsOverlay";
import { BecomeArtistOverlay } from "@/components/BecomeArtistOverlay";
import { AdminOverlay } from "@/components/AdminOverlay";
import { useUiStore } from "@/store/ui-store";
import { useLikesStore } from "@/store/likes-store";
import { usePlayerStore } from "@/store/player-store";
import { createClient } from "@/lib/supabase/client";
import { CoverArt } from "@/components/CoverArt";
import type { BadgeWithStatus } from "@/lib/queries/profile";
import type { Artist, ArtistStats, Profile, TrackWithArtist } from "@/types/database";

interface ProfileOverlayProps {
  profile: Profile | null;
  playlistCount: number;
  followingCount: number;
  badges: BadgeWithStatus[];
  featuredTracks: TrackWithArtist[];
  artist: Artist | null;
  artistStats: ArtistStats | null;
  isAdmin: boolean;
  adminPendingCount: number;
}

const BADGE_ICON = (
  <svg viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.1 5.8 20.5l1.5-6.8-5.1-4.7 6.9-.7z" />
  </svg>
);

export function ProfileOverlay({
  profile,
  playlistCount,
  followingCount,
  badges,
  featuredTracks,
  artist,
  artistStats,
  isAdmin,
  adminPendingCount,
}: ProfileOverlayProps) {
  const router = useRouter();
  const open = useUiStore((s) => s.profileOpen);
  const close = useUiStore((s) => s.closeProfile);
  const likedCount = useLikesStore((s) => s.likedTrackIds.size);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [artistOpen, setArtistOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const featuredBadges = badges.filter((b) => b.featured);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    close();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={`profile-view${open ? " open" : ""}`}>
      <div className="profile-banner">
        <ProfilePhoto
          url={profile?.banner_url ?? null}
          c1="oklch(0.14 0.012 280)"
          c2="oklch(0.78 0.16 75)"
          pattern="b"
          className="profile-banner-bg"
          alt=""
        />
        <div className="profile-top">
          <button aria-label="Fermer" onClick={close}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2>Profil</h2>
          <div style={{ width: 34 }} />
        </div>
      </div>
      <div className="profile-identity-row">
        <ProfilePhoto
          url={profile?.avatar_url ?? null}
          c1="oklch(0.6 0.14 55)"
          c2="oklch(0.65 0.15 75)"
          pattern="e"
          className="profile-avatar-lg"
          alt=""
        />
        <div className="profile-badges-section">
          <div className="pb-header">
            <span className="pb-title">Badges</span>
            <button className="pb-link" onClick={() => setBadgesOpen(true)}>
              Tout voir
            </button>
          </div>
          {featuredBadges.length === 0 ? (
            <button
              className="pb-link"
              style={{ fontSize: 12, textAlign: "left" }}
              onClick={() => (profile ? setEditOpen(true) : setBadgesOpen(true))}
            >
              {profile ? "Choisis tes badges à afficher ici" : "Débloque des badges en utilisant Apollon"}
            </button>
          ) : (
            <div className="pb-row">
              {featuredBadges.map((badge) => (
                <button key={badge.id} className="pb-item" onClick={() => setBadgesOpen(true)}>
                  <div className="pb-icon" style={{ boxShadow: `0 0 0 2px ${badge.icon_c1}33, 0 6px 14px -8px rgba(0,0,0,0.6)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/badges/badge-${badge.slug}.png`} alt={badge.name} />
                  </div>
                  <div className="pb-name">{badge.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="profile-view-inner">
        {!profile && (
          <div
            style={{
              background: "var(--ink3)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 18,
              marginBottom: 22,
              textAlign: "center",
            }}
          >
            <div className="display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Tu navigues en invité
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 16 }}>
              Crée un compte pour liker des titres, suivre tes playlists et débloquer les lives payants.
            </p>
            <button
              onClick={() => router.push("/login")}
              style={{
                width: "100%",
                background: "var(--accent)",
                border: "none",
                borderRadius: 12,
                padding: 13,
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Se connecter / Créer un compte
            </button>
          </div>
        )}

        <div className="profile-hero">
          <div>
            <div className="name">{profile ? profile.display_name : "Invité"}</div>
            <div className="handle">{profile ? `@${profile.username}` : "Non connecté"}</div>
          </div>
          {profile && (
            <button className="profile-edit" onClick={() => setEditOpen(true)}>
              Modifier le profil
            </button>
          )}
        </div>
        {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="n">{likedCount}</div>
            <div className="l">Titres likés</div>
          </div>
          <div className="profile-stat">
            <div className="n">{playlistCount}</div>
            <div className="l">Playlists</div>
          </div>
          <div className="profile-stat">
            <div className="n">{followingCount}</div>
            <div className="l">Suivis</div>
          </div>
        </div>

        {featuredTracks.length > 0 && (
          <div className="profile-featured-tracks">
            <div className="pb-header">
              <span className="pb-title">Titres préférés</span>
            </div>
            <div className="pft-list">
              {featuredTracks.map((track, i) => (
                <button
                  key={track.id}
                  className="pft-item"
                  onClick={() => playQueue(featuredTracks, i)}
                >
                  <CoverArt c1={track.cover_c1} c2={track.cover_c2} pattern={track.cover_pattern} className="pft-cover" />
                  <div className="meta">
                    <div className="t">{track.title}</div>
                    <div className="a">{track.artist.name}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="profile-menu">
          <button className="profile-menu-item" onClick={() => setSettingsOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
            <div className="t">Paramètres</div>
            <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="profile-menu-item" onClick={() => setBadgesOpen(true)}>
            {BADGE_ICON}
            <div className="t">Badges</div>
            <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="profile-menu-item" onClick={() => setArtistOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <div className="t">Devenir artiste</div>
            <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isAdmin && (
            <button className="profile-menu-item" onClick={() => setAdminOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="t">Administration</div>
              {adminPendingCount > 0 && <span className="notif-count-badge">{adminPendingCount}</span>}
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {profile ? (
            <button className="profile-menu-item danger" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="t">Se déconnecter</div>
            </button>
          ) : (
            <button className="profile-menu-item" onClick={() => router.push("/login")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="t">Se connecter</div>
            </button>
          )}
        </div>
      </div>

      <div className={`badges-view${badgesOpen ? " open" : ""}`}>
        <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
          <button aria-label="Retour" onClick={() => setBadgesOpen(false)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2>Mes badges</h2>
          <div style={{ width: 34 }} />
        </div>
        <div className="badges-grid">
          {badges.map((badge) => (
            <div key={badge.id} className={`badge-card${badge.unlocked ? "" : " locked"}`}>
              <div className="badge-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/badges/badge-${badge.slug}.png`} alt={badge.name} />
              </div>
              {!badge.unlocked && (
                <div className="badge-lock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </div>
              )}
              <div className="t">{badge.name}</div>
              <div className="d">{badge.description}</div>
            </div>
          ))}
        </div>
      </div>

      <NotificationsOverlay />
      <SettingsOverlay open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BecomeArtistOverlay open={artistOpen} onClose={() => setArtistOpen(false)} artist={artist} stats={artistStats} />
      {isAdmin && <AdminOverlay open={adminOpen} onClose={() => setAdminOpen(false)} />}

      {profile && (
        <EditProfileOverlay
          profile={profile}
          badges={badges}
          featuredTracks={featuredTracks}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
