import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTrackProposal } from "@/lib/group-votes";

// Proposes adding a track to the group's shared playlist. The proposer's
// own vote is cast as "yes" immediately, so a lone admin (or any group
// where the proposer alone already forms a majority) resolves instantly.
export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const { trackId } = (await request.json()) as { trackId?: string };
  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("friend_group_tracks")
    .select("track_id")
    .eq("group_id", params.groupId)
    .eq("track_id", trackId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Ce titre est déjà dans la playlist du groupe." }, { status: 409 });
  }

  const { data: last } = await supabase
    .from("friend_group_tracks")
    .select("position")
    .eq("group_id", params.groupId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { error: insertError } = await supabase.from("friend_group_tracks").insert({
    group_id: params.groupId,
    track_id: trackId,
    added_by: user.id,
    position,
    status: "proposed_add",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: voteError } = await supabase
    .from("friend_group_track_votes")
    .insert({ group_id: params.groupId, track_id: trackId, user_id: user.id, vote: true });
  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  await resolveTrackProposal(supabase, params.groupId, trackId);

  return NextResponse.json({ ok: true });
}
