import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  FriendGroup,
  FriendGroupInviteWithDetails,
  FriendGroupMember,
  FriendGroupMessageWithSender,
  FriendGroupSession,
  FriendGroupSummary,
  FriendGroupTrackWithDetails,
  Profile,
} from "@/types/database";

const GROUP_TRACK_SELECT = "*, track:tracks(*, artist:artists(id, name)), votes:friend_group_track_votes(user_id, vote)";
const MESSAGE_SELECT = "*, sender:profiles(id, username, display_name, avatar_url)";

// Membership is enforced by RLS on every one of these tables, so a caller
// who isn't a member of `groupId` simply gets an empty/null result rather
// than an error — these functions don't re-check membership themselves.

export async function getMyGroups(userId: string): Promise<FriendGroupSummary[]> {
  const supabase = createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("friend_group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (membershipError) throw membershipError;
  if (memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const [{ data: groups, error: groupsError }, { data: allMembers, error: allMembersError }] = await Promise.all([
    supabase.from("friend_groups").select("*").in("id", groupIds).order("created_at", { ascending: false }),
    supabase.from("friend_group_members").select("group_id").in("group_id", groupIds),
  ]);
  if (groupsError) throw groupsError;
  if (allMembersError) throw allMembersError;

  const counts = new Map<string, number>();
  for (const row of allMembers) counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);

  return groups.map((group) => ({ ...group, member_count: counts.get(group.id) ?? 0 }));
}

export async function getGroup(groupId: string): Promise<FriendGroup | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("friend_groups").select("*").eq("id", groupId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getGroupMembers(
  groupId: string
): Promise<(FriendGroupMember & { profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_group_members")
    .select("*, profile:profiles(id, username, display_name, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data as unknown as (FriendGroupMember & {
    profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  })[];
}

export async function getGroupTracks(groupId: string): Promise<FriendGroupTrackWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_group_tracks")
    .select(GROUP_TRACK_SELECT)
    .eq("group_id", groupId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data as unknown as FriendGroupTrackWithDetails[];
}

export async function getGroupSession(groupId: string): Promise<FriendGroupSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("friend_group_sessions").select("*").eq("group_id", groupId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecentMessages(groupId: string, limit = 100): Promise<FriendGroupMessageWithSender[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_group_messages")
    .select(MESSAGE_SELECT)
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as unknown as FriendGroupMessageWithSender[];
}

export async function getPendingInvites(userId: string): Promise<FriendGroupInviteWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_group_invites")
    .select("*, group:friend_groups(id, name), inviter:profiles!friend_group_invites_invited_by_fkey(username, display_name)")
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as FriendGroupInviteWithDetails[];
}

export async function searchUsersByUsername(query: string, excludeUserId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${query}%`)
    .neq("id", excludeUserId)
    .limit(10);
  if (error) throw error;
  return data;
}
