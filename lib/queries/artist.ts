import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Artist, ArtistStats, TrackWithArtist } from "@/types/database";

export async function getMyArtistProfile(userId: string): Promise<Artist | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("artists").select("*").eq("owner_id", userId).maybeSingle();
  if (error) throw error;
  return data as Artist | null;
}

// Public artist page (distinct from getMyArtistProfile, which is "the
// artist profile I myself own"). Only approved artists/tracks are shown —
// mirrors the moderation gate the rest of the catalog already has.
export async function getArtistById(artistId: string): Promise<Artist | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", artistId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data as Artist | null;
}

export async function getArtistTracks(artistId: string): Promise<TrackWithArtist[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .select("*, artist:artists(id, name)")
    .eq("artist_id", artistId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as TrackWithArtist[];
}

// "Artiste certifié" is granted as a badge on the owning user (via Gestion
// Apollon), not as a column on artists — so a public visitor derives
// verified status by checking whether the owner holds that badge.
export async function getArtistVerifiedStatus(ownerId: string | null): Promise<boolean> {
  if (!ownerId) return false;
  const supabase = createClient();
  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("id")
    .eq("slug", "artiste-certifie")
    .maybeSingle();
  if (badgeError) throw badgeError;
  if (!badge) return false;
  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", ownerId)
    .eq("badge_id", badge.id)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// Distinct listeners of this artist's approved tracks over the last 30
// days — the public, Spotify-style "auditeurs mensuels" metric. Distinct
// from getArtistStats's totalListeners, which is all-time and mixes in
// likes (and is scoped to the artist's own dashboard).
export async function getArtistMonthlyListeners(artistId: string): Promise<number> {
  const supabase = createClient();
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("artist_id", artistId)
    .eq("status", "approved");
  if (tracksError) throw tracksError;
  const trackIds = (tracks ?? []).map((t) => t.id);
  if (trackIds.length === 0) return 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: plays, error: playsError } = await supabase
    .from("track_plays")
    .select("user_id")
    .in("track_id", trackIds)
    .gte("created_at", thirtyDaysAgo);
  if (playsError) throw playsError;

  const listenerIds = new Set<string>();
  for (const p of plays ?? []) if (p.user_id) listenerIds.add(p.user_id);
  return listenerIds.size;
}

// All-time play count on this artist's approved tracks — public counterpart
// to getArtistStats's totalPlays (which includes pending/rejected tracks
// for the owner's own dashboard).
export async function getArtistTotalPlays(artistId: string): Promise<number> {
  const supabase = createClient();
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id")
    .eq("artist_id", artistId)
    .eq("status", "approved");
  if (tracksError) throw tracksError;
  const trackIds = (tracks ?? []).map((t) => t.id);
  if (trackIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("track_plays")
    .select("id", { count: "exact", head: true })
    .in("track_id", trackIds);
  if (error) throw error;
  return count ?? 0;
}

export async function getArtistStats(artistId: string): Promise<ArtistStats> {
  const supabase = createClient();
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id, title, status")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });
  if (tracksError) throw tracksError;

  const trackIds = (tracks ?? []).map((t) => t.id);
  if (trackIds.length === 0) {
    return { totalPlays: 0, totalLikes: 0, totalListeners: 0, trackCount: 0, tracks: [] };
  }

  const [{ data: plays, error: playsError }, { data: likes, error: likesError }] = await Promise.all([
    supabase.from("track_plays").select("track_id, user_id").in("track_id", trackIds),
    supabase.from("likes").select("track_id, user_id").in("track_id", trackIds),
  ]);
  if (playsError) throw playsError;
  if (likesError) throw likesError;

  const listenerIds = new Set<string>();
  for (const p of plays ?? []) if (p.user_id) listenerIds.add(p.user_id);
  for (const l of likes ?? []) if (l.user_id) listenerIds.add(l.user_id);

  const perTrack = new Map(trackIds.map((id) => [id, { plays: 0, likes: 0 }]));
  for (const p of plays ?? []) perTrack.get(p.track_id)!.plays++;
  for (const l of likes ?? []) perTrack.get(l.track_id)!.likes++;

  return {
    totalPlays: plays?.length ?? 0,
    totalLikes: likes?.length ?? 0,
    totalListeners: listenerIds.size,
    trackCount: trackIds.length,
    tracks: (tracks ?? []).map((t) => ({
      track_id: t.id,
      title: t.title,
      status: t.status,
      plays: perTrack.get(t.id)?.plays ?? 0,
      likes: perTrack.get(t.id)?.likes ?? 0,
    })),
  };
}
