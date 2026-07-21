import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SessionPayload {
  // "claim": the client believes it should become (temp) controller — see
  // lib/useGroupRoomChannel.ts, called when the permanent admin isn't
  // present and no one else already controls, or when the current
  // controller has left presence.
  claim?: boolean;
  isTemp?: boolean;
  // Playback updates — only accepted from the current controller.
  currentTrackId?: string | null;
  isPlaying?: boolean;
  positionSeconds?: number;
}

// All writes to the shared listening session go through here rather than
// direct client table updates, because "who's allowed to control playback"
// depends on presence-derived state (see plan) that RLS can't express.
export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const body = (await request.json()) as SessionPayload;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("friend_group_members")
    .select("user_id")
    .eq("group_id", params.groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("friend_group_sessions")
    .select("*")
    .eq("group_id", params.groupId)
    .single();
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (body.claim) {
    // Claiming control is always allowed (the client only asks to when the
    // rightful controller — admin present, else earliest-present member —
    // is itself). Last write wins; acceptable for small friend groups.
    const { error } = await supabase
      .from("friend_group_sessions")
      .update({ controller_id: user.id, controller_is_temp: body.isTemp ?? false, updated_at: new Date().toISOString() })
      .eq("group_id", params.groupId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (session.controller_id !== user.id) {
    return NextResponse.json({ error: "Seul le contrôleur actuel peut changer la lecture." }, { status: 403 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.currentTrackId !== undefined) update.current_track_id = body.currentTrackId;
  if (body.isPlaying !== undefined) update.is_playing = body.isPlaying;
  if (body.positionSeconds !== undefined) update.position_seconds = body.positionSeconds;
  if (body.isPlaying !== undefined || body.positionSeconds !== undefined) {
    update.position_updated_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("friend_group_sessions")
    .update(update)
    .eq("group_id", params.groupId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
