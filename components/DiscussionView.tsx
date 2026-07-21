"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GroupRoomOverlay } from "@/components/GroupRoomOverlay";
import { CreateGroupFlow } from "@/components/CreateGroupFlow";
import { AddFriendFlow } from "@/components/AddFriendFlow";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { DirectMessageOverlay } from "@/components/DirectMessageOverlay";
import type { Friend, FriendGroupInviteWithDetails, FriendGroupSummary, FriendRequestWithRequester } from "@/types/database";

interface DiscussionViewProps {
  userId: string;
  groups: FriendGroupSummary[];
  pendingInvites: FriendGroupInviteWithDetails[];
  pendingFriendRequests: FriendRequestWithRequester[];
  friends: Friend[];
}

// A real page (not a sliding overlay) so the tab bar stays usable at all
// times — see components/TabBar.tsx. Opening a specific group still uses
// GroupRoomOverlay as a focused modal, which makes sense for an active
// listening/chat session.
export function DiscussionView({ userId, groups, pendingInvites, pendingFriendRequests, friends }: DiscussionViewProps) {
  const router = useRouter();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondingFriendId, setRespondingFriendId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);

  async function handleRespond(inviteId: string, accept: boolean) {
    setRespondingId(inviteId);
    try {
      const res = await fetch(`/api/groups/invites/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) router.refresh();
    } finally {
      setRespondingId(null);
    }
  }

  async function handleRespondFriend(requestId: string, accept: boolean) {
    setRespondingFriendId(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) router.refresh();
    } finally {
      setRespondingFriendId(null);
    }
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Playlists entre amis</h1>
      </div>

      {pendingInvites.length > 0 && (
        <>
          <div className="grm-section-title">
            <span>Invitations reçues</span>
          </div>
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="invite-card">
              <div className="meta">
                <div className="t">{invite.group.name}</div>
                <div className="s">Invité par @{invite.inviter.username}</div>
              </div>
              <div className="invite-actions">
                <button
                  className="accept"
                  disabled={respondingId === invite.id}
                  aria-label="Accepter"
                  onClick={() => handleRespond(invite.id, true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="decline"
                  disabled={respondingId === invite.id}
                  aria-label="Refuser"
                  onClick={() => handleRespond(invite.id, false)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="grm-section-title" style={{ marginTop: pendingInvites.length > 0 ? 22 : 4 }}>
        <span>Créer un groupe</span>
      </div>
      <CreateGroupFlow
        onCreated={(groupId) => {
          setJustCreated(true);
          setActiveGroupId(groupId);
        }}
      />

      {pendingFriendRequests.length > 0 && (
        <>
          <div className="grm-section-title" style={{ marginTop: 22 }}>
            <span>Demandes d&apos;ami reçues</span>
          </div>
          {pendingFriendRequests.map((req) => (
            <div key={req.id} className="invite-card">
              <div className="meta">
                <div className="t">{req.requester.display_name}</div>
                <div className="s">@{req.requester.username}</div>
              </div>
              <div className="invite-actions">
                <button
                  className="accept"
                  disabled={respondingFriendId === req.id}
                  aria-label="Accepter"
                  onClick={() => handleRespondFriend(req.id, true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="decline"
                  disabled={respondingFriendId === req.id}
                  aria-label="Refuser"
                  onClick={() => handleRespondFriend(req.id, false)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="grm-section-title" style={{ marginTop: 22 }}>
        <span>Ajouter un ami</span>
      </div>
      <AddFriendFlow />

      <div className="grm-section-title" style={{ marginTop: 22 }}>
        <span>Mes amis</span>
      </div>
      {friends.length === 0 ? (
        <p className="groups-empty">Les amis que tu ajoutes (ou qui acceptent ta demande) apparaissent ici.</p>
      ) : (
        friends.map((friend) => (
          <button
            key={friend.requestId}
            className="cgf-person-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", font: "inherit", textAlign: "left" }}
            onClick={() => setActiveFriend(friend)}
          >
            <div className="avatar">
              <ProfilePhoto
                url={friend.profile.avatar_url}
                c1="oklch(0.6 0.14 55)"
                c2="oklch(0.65 0.15 75)"
                pattern="e"
                alt={friend.profile.display_name}
              />
            </div>
            <div className="meta">
              <div className="t">{friend.profile.display_name}</div>
              <div className="s">@{friend.profile.username}</div>
            </div>
          </button>
        ))
      )}

      <div className="grm-section-title" style={{ marginTop: 22 }}>
        <span>Mes groupes</span>
      </div>
      {groups.length === 0 ? (
        <p className="groups-empty">
          Crée un groupe ou attends une invitation pour partager une playlist et écouter en même temps que tes amis.
        </p>
      ) : (
        groups.map((group) => (
          <button
            key={group.id}
            className="group-card"
            onClick={() => {
              setJustCreated(false);
              setActiveGroupId(group.id);
            }}
          >
            <div className="ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="meta">
              <div className="t">{group.name}</div>
              <div className="s">
                {group.member_count} membre{group.member_count === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        ))
      )}

      {activeGroupId && (
        <GroupRoomOverlay
          groupId={activeGroupId}
          userId={userId}
          onClose={() => setActiveGroupId(null)}
          autoOpenChat={justCreated}
        />
      )}

      {activeFriend && (
        <DirectMessageOverlay friend={activeFriend} userId={userId} onClose={() => setActiveFriend(null)} />
      )}
    </div>
  );
}
