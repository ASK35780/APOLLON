import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTrackProposal } from "@/lib/group-votes";

// Proposes removing an active track from the group's shared playlist.
export async function POST(_request: Request, { params }: { params: { groupId: string; trackId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("friend_group_tracks")
    .select("status")
    .eq("group_id", params.groupId)
    .eq("track_id", params.trackId)
    .maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing || existing.status !== "active") {
    return NextResponse.json({ error: "Ce titre n'est pas actif dans la playlist." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("friend_group_tracks")
    .update({ status: "proposed_remove" })
    .eq("group_id", params.groupId)
    .eq("track_id", params.trackId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: voteError } = await supabase
    .from("friend_group_track_votes")
    .insert({ group_id: params.groupId, track_id: params.trackId, user_id: user.id, vote: true });
  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  await resolveTrackProposal(supabase, params.groupId, params.trackId);

  return NextResponse.json({ ok: true });
}
