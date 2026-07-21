"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FriendGroupMessageWithSender, FriendGroupSession } from "@/types/database";

export interface LiveSessionState {
  currentTrackId: string | null;
  isPlaying: boolean;
  positionSeconds: number;
  positionUpdatedAt: number; // client Date.now() ms — see elapsedSeconds()
  controllerId: string | null;
}

interface PresenceMeta {
  user_id: string;
  joined_at: number;
}

interface UseGroupRoomChannelOptions {
  groupId: string;
  userId: string;
  adminId: string;
  initialSession: FriendGroupSession | null;
  onMessage: (message: FriendGroupMessageWithSender) => void;
  onTracksChanged: () => void;
}

function toLiveState(session: FriendGroupSession | null): LiveSessionState {
  return {
    currentTrackId: session?.current_track_id ?? null,
    isPlaying: session?.is_playing ?? false,
    positionSeconds: session?.position_seconds ?? 0,
    positionUpdatedAt: session ? new Date(session.position_updated_at).getTime() : Date.now(),
    controllerId: session?.controller_id ?? null,
  };
}

// Derives elapsed playback position "now" from a synced state — used by
// every member's clock, not just the controller's, so everyone reads the
// same computed position without a shared audio stream.
export function elapsedSeconds(state: LiveSessionState): number {
  if (!state.isPlaying) return state.positionSeconds;
  return state.positionSeconds + (Date.now() - state.positionUpdatedAt) / 1000;
}

// One Realtime channel per group room: Presence (who's here — drives temp
// admin hand-off and the "delete chat when empty" rule), Broadcast (instant
// play/pause/seek/track-change deltas from whoever controls playback), and
// Postgres Changes (new chat messages, track/vote updates land live for
// everyone without polling — see supabase/migrations/0005_friend_groups.sql
// for the tables added to the realtime publication).
export function useGroupRoomChannel({
  groupId,
  userId,
  adminId,
  initialSession,
  onMessage,
  onTracksChanged,
}: UseGroupRoomChannelOptions) {
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [liveState, setLiveState] = useState<LiveSessionState>(() => toLiveState(initialSession));
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onTracksChangedRef = useRef(onTracksChanged);
  onMessageRef.current = onMessage;
  onTracksChangedRef.current = onTracksChanged;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`friend-group:${groupId}`, {
      config: { presence: { key: userId } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      setPresentIds(Object.keys(channel.presenceState()));
    });

    channel.on("broadcast", { event: "playback_sync" }, ({ payload }) => {
      setLiveState(payload as LiveSessionState);
    });

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "friend_group_messages", filter: `group_id=eq.${groupId}` },
      (payload) => onMessageRef.current(payload.new as unknown as FriendGroupMessageWithSender)
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_group_tracks", filter: `group_id=eq.${groupId}` },
      () => onTracksChangedRef.current()
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_group_track_votes", filter: `group_id=eq.${groupId}` },
      () => onTracksChangedRef.current()
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const meta: PresenceMeta = { user_id: userId, joined_at: Date.now() };
        await channel.track(meta);
      }
    });

    return () => {
      const remaining = Object.keys(channel.presenceState()).filter((id) => id !== userId);
      channel.untrack();
      supabase.removeChannel(channel);
      // Best-effort: only fires on a clean unmount (closing the room screen
      // in-app), not on a hard tab close — see plan's "hors scope" note.
      if (remaining.length === 0) {
        fetch(`/api/groups/${groupId}/messages`, { method: "DELETE" }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userId]);

  // The rightful controller: the permanent admin if present, otherwise
  // whoever among currently-present members has been here the longest.
  const rightfulControllerId = useMemo(() => {
    if (presentIds.length === 0) return null;
    if (presentIds.includes(adminId)) return adminId;
    const state = channelRef.current?.presenceState<PresenceMeta>() ?? {};
    let earliest: { id: string; joinedAt: number } | null = null;
    for (const id of presentIds) {
      const meta = state[id]?.[0];
      const joinedAt = meta?.joined_at ?? Number.POSITIVE_INFINITY;
      if (!earliest || joinedAt < earliest.joinedAt) earliest = { id, joinedAt };
    }
    return earliest?.id ?? null;
  }, [presentIds, adminId]);

  // If presence says it should be me but the DB/broadcast state still
  // credits someone who's no longer here, claim control.
  useEffect(() => {
    if (rightfulControllerId !== userId) return;
    if (liveState.controllerId === userId) return;
    if (liveState.controllerId && presentIds.includes(liveState.controllerId)) return;

    fetch(`/api/groups/${groupId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: true, isTemp: userId !== adminId }),
    })
      .then(() => {
        setLiveState((prev) => ({ ...prev, controllerId: userId }));
      })
      .catch(() => {});
  }, [rightfulControllerId, liveState.controllerId, presentIds, userId, groupId, adminId]);

  // Pushes a new playback state: instantly over Broadcast for everyone
  // currently in the room, and persisted via the session API so a member
  // opening the room later sees where things stand. `positionUpdatedAt` is
  // stamped here rather than by callers — it's just "now".
  function broadcastPlayback(next: Omit<LiveSessionState, "controllerId" | "positionUpdatedAt">) {
    const payload: LiveSessionState = { ...next, positionUpdatedAt: Date.now(), controllerId: userId };
    setLiveState(payload);
    channelRef.current?.send({ type: "broadcast", event: "playback_sync", payload });
    fetch(`/api/groups/${groupId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrackId: next.currentTrackId,
        isPlaying: next.isPlaying,
        positionSeconds: next.positionSeconds,
      }),
    }).catch(() => {});
  }

  return {
    presentIds,
    liveState,
    isController: liveState.controllerId === userId,
    broadcastPlayback,
  };
}
