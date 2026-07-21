import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroup, getGroupMembers, getGroupSession, getGroupTracks, getRecentMessages } from "@/lib/queries/groups";

// Full snapshot for opening a group's room — components/GroupRoomOverlay.tsx
// fetches this once on open, then lib/useGroupRoomChannel.ts takes over for
// live updates (presence, playback broadcasts, new messages/votes).
export async function GET(_request: Request, { params }: { params: { groupId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const [group, members, tracks, session, messages] = await Promise.all([
    getGroup(params.groupId),
    getGroupMembers(params.groupId),
    getGroupTracks(params.groupId),
    getGroupSession(params.groupId),
    getRecentMessages(params.groupId),
  ]);

  if (!group) {
    return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  }

  return NextResponse.json({ group, members, tracks, session, messages });
}
