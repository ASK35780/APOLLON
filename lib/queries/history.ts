import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TrackWithArtist } from "@/types/database";

// Distinct tracks from the user's own track_plays, most-recent first — a
// listener-facing "recently played" list (track_plays already existed for
// artist-facing play-count stats, but nothing surfaced it to the listener).
export async function getRecentlyPlayed(userId: string, limit = 10): Promise<TrackWithArtist[]> {
  const supabase = createClient();
  // Over-fetch raw play rows since the same track can appear many times,
  // then dedupe by track_id keeping the most recent occurrence.
  const { data: plays, error: playsError } = await supabase
    .from("track_plays")
    .select("track_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit * 5);
  if (playsError) throw playsError;

  const orderedIds: string[] = [];
  const seen = new Set<string>();
  for (const p of plays ?? []) {
    if (seen.has(p.track_id)) continue;
    seen.add(p.track_id);
    orderedIds.push(p.track_id);
    if (orderedIds.length >= limit) break;
  }
  if (orderedIds.length === 0) return [];

  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("*, artist:artists(id, name)")
    .in("id", orderedIds)
    .eq("status", "approved");
  if (tracksError) throw tracksError;

  const byId = new Map((tracks ?? []).map((t) => [t.id, t]));
  return orderedIds.map((id) => byId.get(id)).filter(Boolean) as unknown as TrackWithArtist[];
}
