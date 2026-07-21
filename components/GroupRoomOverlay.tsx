"use client";

import { useEffect, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { GroupChat } from "@/components/GroupChat";
import { elapsedSeconds, useGroupRoomChannel } from "@/lib/useGroupRoomChannel";
import type {
  FriendGroup,
  FriendGroupMember,
  FriendGroupMessageWithSender,
  FriendGroupSession,
  FriendGroupTrackWithDetails,
  Profile,
  TrackWithArtist,
} from "@/types/database";

type MemberWithProfile = FriendGroupMember & {
  profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
};

interface RoomDetail {
  group: FriendGroup;
  members: MemberWithProfile[];
  tracks: FriendGroupTrackWithDetails[];
  session: FriendGroupSession | null;
  messages: FriendGroupMessageWithSender[];
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

interface GroupRoomOverlayProps {
  groupId: string;
  userId: string;
  onClose: () => void;
  autoOpenChat?: boolean;
}

export function GroupRoomOverlay({ groupId, userId, onClose, autoOpenChat = false }: GroupRoomOverlayProps) {
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(autoOpenChat);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrackWithArtist[]>([]);
  const [, setTick] = useState(0);

  async function fetchDetail() {
    const res = await fetch(`/api/groups/${groupId}`);
    if (!res.ok) {
      setError("Impossible de charger ce groupe.");
      return;
    }
    setDetail((await res.json()) as RoomDetail);
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const { presentIds, liveState, isController, broadcastPlayback } = useGroupRoomChannel({
    groupId,
    userId,
    adminId: detail?.group.created_by ?? "",
    initialSession: detail?.session ?? null,
    onMessage: (message) => setDetail((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev)),
    onTracksChanged: fetchDetail,
  });

  useEffect(() => {
    if (!liveState.isPlaying) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [liveState.isPlaying]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: TrackWithArtist[]) => setSearchResults(data));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  if (error) {
    return (
      <div className="group-room-view open">
        <div className="groups-top">
          <button aria-label="Retour" onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2>Groupe</h2>
        </div>
        <p className="groups-empty">{error}</p>
      </div>
    );
  }

  if (!detail) return <div className="group-room-view open" />;

  const { group, members, tracks } = detail;
  const currentEntry = tracks.find((t) => t.track_id === liveState.currentTrackId);
  const currentTrack = currentEntry?.track ?? null;
  const activeTracks = tracks.filter((t) => t.status === "active");
  const pendingTracks = tracks.filter((t) => t.status !== "active");

  async function handleTogglePlay() {
    if (!isController || !currentTrack) return;
    broadcastPlayback({
      currentTrackId: currentTrack.id,
      isPlaying: !liveState.isPlaying,
      positionSeconds: elapsedSeconds(liveState),
    });
  }

  function handlePlayTrack(trackId: string) {
    if (!isController) return;
    broadcastPlayback({ currentTrackId: trackId, isPlaying: true, positionSeconds: 0 });
  }

  async function handleProposeRemove(trackId: string) {
    await fetch(`/api/groups/${groupId}/tracks/${trackId}`, { method: "POST" });
    fetchDetail();
  }

  async function handleVote(trackId: string, vote: boolean) {
    await fetch(`/api/groups/${groupId}/tracks/${trackId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    });
    fetchDetail();
  }

  async function handleAddTrack(trackId: string) {
    await fetch(`/api/groups/${groupId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });
    setSearchQuery("");
    setSearchResults([]);
    fetchDetail();
  }

  async function handleInvite() {
    if (!inviteUsername.trim()) return;
    setInviteStatus(null);
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: inviteUsername.trim() }),
    });
    const json = (await res.json()) as { error?: string };
    if (res.ok) {
      setInviteStatus(`Invitation envoyée à @${inviteUsername.trim()}.`);
      setInviteUsername("");
    } else {
      setInviteStatus(json.error ?? "Échec de l'invitation.");
    }
  }

  return (
    <div className="group-room-view open">
      <div className="groups-top">
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>{group.name}</h2>
      </div>

      <div className="grm-members">
        {members.map((m) => {
          const present = presentIds.includes(m.user_id);
          const isControllerMember = liveState.controllerId === m.user_id;
          return (
            <div key={m.user_id} className={`grm-member${present ? " present" : ""}${isControllerMember ? " controller" : ""}`}>
              <div className="avatar">
                <ProfilePhoto
                  url={m.profile.avatar_url}
                  c1="oklch(0.6 0.14 55)"
                  c2="oklch(0.65 0.15 75)"
                  pattern="e"
                  alt={m.profile.display_name}
                />
                <div className="presence-dot" />
              </div>
              <div className="name">{m.profile.display_name}</div>
            </div>
          );
        })}
      </div>

      <div className="grm-player">
        {currentTrack ? (
          <>
            <CoverArt c1={currentTrack.cover_c1} c2={currentTrack.cover_c2} pattern={currentTrack.cover_pattern} />
            <div className="meta">
              <div className="t">{currentTrack.title}</div>
              <div className="a">{currentTrack.artist.name}</div>
              <div className="status">
                {formatTime(elapsedSeconds(liveState))} / {formatTime(currentTrack.duration_seconds)}
                {!isController && " · en écoute avec le groupe"}
              </div>
            </div>
            <button className="grm-player-btn" disabled={!isController} onClick={handleTogglePlay} aria-label="Lecture / pause">
              {liveState.isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <div className="empty">Aucun titre en cours — lance un morceau ci-dessous.</div>
        )}
      </div>

      <div className="grm-section-title">
        <span>Playlist du groupe</span>
      </div>
      {activeTracks.length === 0 && pendingTracks.length === 0 ? (
        <p className="groups-empty">Aucun titre pour l&apos;instant — ajoute-en un ci-dessous.</p>
      ) : (
        [...pendingTracks, ...activeTracks].map((entry) => {
          const myVote = entry.votes.find((v) => v.user_id === userId);
          const yes = entry.votes.filter((v) => v.vote).length;
          const no = entry.votes.filter((v) => !v.vote).length;
          const majority = Math.floor(members.length / 2) + 1;
          const isCurrent = entry.track_id === liveState.currentTrackId;
          return (
            <div key={entry.track_id}>
              <div className={`grm-track-row${isCurrent ? " current" : ""}`}>
                <div className="meta" onClick={() => entry.status === "active" && handlePlayTrack(entry.track_id)}>
                  <div className="t">{entry.track.title}</div>
                  <div className="a">{entry.track.artist.name}</div>
                </div>
                {entry.status === "active" && (
                  <button className="grm-remove-btn" onClick={() => handleProposeRemove(entry.track_id)}>
                    Retirer
                  </button>
                )}
              </div>
              {entry.status !== "active" && (
                <div className="grm-vote-box">
                  <div className="label">
                    {entry.status === "proposed_add" ? "Proposition d'ajout" : "Proposition de retrait"} — majorité
                    nécessaire : {majority}
                  </div>
                  <div className="grm-vote-row">
                    <button className={`yes${myVote?.vote === true ? " voted" : ""}`} onClick={() => handleVote(entry.track_id, true)}>
                      Pour
                    </button>
                    <button className={`no${myVote?.vote === false ? " voted" : ""}`} onClick={() => handleVote(entry.track_id, false)}>
                      Contre
                    </button>
                    <span className="tally">
                      {yes} pour · {no} contre
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="grm-add-track">
        <div className="grm-section-title">
          <span>Ajouter un titre</span>
        </div>
        <div className="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input placeholder="Chercher un titre…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {searchResults.length > 0 && (
          <div className="grm-search-results">
            {searchResults.map((t) => (
              <button key={t.id} className="grm-search-result" onClick={() => handleAddTrack(t.id)}>
                <CoverArt c1={t.cover_c1} c2={t.cover_c2} pattern={t.cover_pattern} />
                <div className="meta">
                  <div className="t">{t.title}</div>
                  <div className="a">{t.artist.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grm-section-title" style={{ marginTop: 22 }}>
        <span>Inviter un ami</span>
      </div>
      <div className="grm-invite-row">
        <input
          placeholder="@pseudo"
          value={inviteUsername}
          onChange={(e) => setInviteUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        />
        <button onClick={handleInvite}>Inviter</button>
      </div>
      {inviteStatus && (
        <p className="edit-upload-status" style={{ color: "var(--muted)", marginTop: 8 }}>
          {inviteStatus}
        </p>
      )}

      <button className="grm-chat-fab" onClick={() => setChatOpen(true)} aria-label="Ouvrir le chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <GroupChat groupId={groupId} userId={userId} messages={detail.messages} open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
