import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTrackProposal } from "@/lib/group-votes";

export async function POST(request: Request, { params }: { params: { groupId: string; trackId: string } }) {
  const { vote } = (await request.json()) as { vote?: boolean };
  if (typeof vote !== "boolean") {
    return NextResponse.json({ error: "vote must be a boolean" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: track, error: trackError } = await supabase
    .from("friend_group_tracks")
    .select("status")
    .eq("group_id", params.groupId)
    .eq("track_id", params.trackId)
    .maybeSingle();
  if (trackError) {
    return NextResponse.json({ error: trackError.message }, { status: 500 });
  }
  if (!track || track.status === "active") {
    return NextResponse.json({ error: "Aucune proposition en cours pour ce titre." }, { status: 409 });
  }

  const { error: voteError } = await supabase.from("friend_group_track_votes").upsert(
    { group_id: params.groupId, track_id: params.trackId, user_id: user.id, vote },
    { onConflict: "group_id,track_id,user_id" }
  );
  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  await resolveTrackProposal(supabase, params.groupId, params.trackId);

  return NextResponse.json({ ok: true });
}
