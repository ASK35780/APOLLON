import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Friend, FriendRequestWithRequester, Profile } from "@/types/database";

export async function getPendingFriendRequests(userId: string): Promise<FriendRequestWithRequester[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, requester:profiles!friend_requests_requester_id_fkey(username, display_name)")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as FriendRequestWithRequester[];
}

type FriendRow = {
  id: string;
  requester_id: string;
  requester: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  addressee: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
};

export async function getFriends(userId: string): Promise<Friend[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, requester_id, requester:profiles!friend_requests_requester_id_fkey(id, username, display_name, avatar_url), addressee:profiles!friend_requests_addressee_id_fkey(id, username, display_name, avatar_url)"
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("responded_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FriendRow[]).map((row) => ({
    requestId: row.id,
    profile: row.requester_id === userId ? row.addressee : row.requester,
  }));
}
