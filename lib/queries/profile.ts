import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Badge, Profile, TrackWithArtist } from "@/types/database";

export type BadgeWithStatus = Badge & { unlocked: boolean; featured: boolean };

export async function getProfile(userId: string): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

// Manually-curated showcase, not derived from likes — see
// supabase/migrations/0019_profile_bio_and_featured_tracks.sql.
export async function getFeaturedTracks(userId: string): Promise<TrackWithArtist[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profile_featured_tracks")
    .select("track:tracks(*, artist:artists(id, name))")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.track) as unknown as TrackWithArtist[];
}

export async function getAllBadges(): Promise<BadgeWithStatus[]> {
  const supabase = createClient();
  const { data: badges, error } = await supabase.from("badges").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return badges.map((badge) => ({ ...badge, unlocked: false, featured: false }));
}

export async function getBadgesWithUnlockStatus(userId: string): Promise<BadgeWithStatus[]> {
  const supabase = createClient();
  const [{ data: badges, error: badgesError }, { data: userBadges, error: unlockedError }] = await Promise.all([
    supabase.from("badges").select("*").order("created_at", { ascending: true }),
    supabase.from("user_badges").select("badge_id, featured").eq("user_id", userId),
  ]);
  if (badgesError) throw badgesError;
  if (unlockedError) throw unlockedError;

  const unlockedById = new Map(userBadges.map((row) => [row.badge_id, row.featured]));
  return badges.map((badge) => ({
    ...badge,
    unlocked: unlockedById.has(badge.id),
    featured: unlockedById.get(badge.id) ?? false,
  }));
}
