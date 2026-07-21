import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getFollowedArtistIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("artist_follows").select("artist_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.artist_id));
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("artist_follows")
    .select("artist_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function getArtistFollowerCount(artistId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("artist_follows")
    .select("user_id", { count: "exact", head: true })
    .eq("artist_id", artistId);
  if (error) throw error;
  return count ?? 0;
}

export async function isFollowingArtist(userId: string, artistId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("artist_follows")
    .select("artist_id")
    .eq("user_id", userId)
    .eq("artist_id", artistId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
