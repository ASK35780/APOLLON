import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Recomputes and, if decided, applies the outcome of the add/remove
// proposal currently pending on (groupId, trackId). Called after every vote
// is cast — see app/api/groups/[groupId]/tracks/[trackId]/vote/route.ts.
//
// Majority = floor(members/2) + 1. A strict tie is only possible once every
// member has voted on an even-sized group; the group's creator (permanent
// admin) then breaks it with their own vote value.
export async function resolveTrackProposal(supabase: SupabaseClient, groupId: string, trackId: string) {
  const [
    { data: group, error: groupError },
    { data: members, error: membersError },
    { data: votes, error: votesError },
    { data: track, error: trackError },
  ] = await Promise.all([
    supabase.from("friend_groups").select("created_by").eq("id", groupId).single(),
    supabase.from("friend_group_members").select("user_id").eq("group_id", groupId),
    supabase.from("friend_group_track_votes").select("user_id, vote").eq("group_id", groupId).eq("track_id", trackId),
    supabase.from("friend_group_tracks").select("status").eq("group_id", groupId).eq("track_id", trackId).single(),
  ]);
  if (groupError) throw groupError;
  if (membersError) throw membersError;
  if (votesError) throw votesError;
  if (trackError) throw trackError;
  if (track.status === "active") return;

  const totalMembers = members.length;
  const majority = Math.floor(totalMembers / 2) + 1;
  const yes = votes.filter((v) => v.vote).length;
  const no = votes.filter((v) => !v.vote).length;

  let approved: boolean | null = null;
  if (yes >= majority) approved = true;
  else if (no >= majority) approved = false;
  else if (yes + no === totalMembers) {
    const adminVote = votes.find((v) => v.user_id === group.created_by);
    approved = adminVote ? adminVote.vote : false;
  }

  if (approved === null) return; // still pending — not enough votes yet

  if (approved === (track.status === "proposed_add")) {
    // proposed_add + approved, or proposed_remove + rejected → track is/stays active
    await supabase.from("friend_group_tracks").update({ status: "active" }).eq("group_id", groupId).eq("track_id", trackId);
    await supabase.from("friend_group_track_votes").delete().eq("group_id", groupId).eq("track_id", trackId);
  } else {
    // proposed_add + rejected (never really added), or proposed_remove + approved → gone.
    // Deleting the track row cascades the votes too.
    await supabase.from("friend_group_tracks").delete().eq("group_id", groupId).eq("track_id", trackId);
  }
}
