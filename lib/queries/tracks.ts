import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TrackWithArtist } from "@/types/database";

const TRACK_SELECT = "*, artist:artists(id, name)";

export async function getAllTracks(): Promise<TrackWithArtist[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tracks").select(TRACK_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as TrackWithArtist[];
}

export async function searchTracks(query: string): Promise<TrackWithArtist[]> {
  const supabase = createClient();
  const pattern = `%${query}%`;

  // PostgREST's or() can't mix a column on the base table with a column on
  // an embedded relation in a single filter tree, so title and artist-name
  // matches are two separate queries, merged and deduped here. The artist
  // query uses !inner so the embedded filter actually restricts which
  // tracks come back (a plain embed filter only prunes the nested object).
  const [byTitle, byArtist] = await Promise.all([
    supabase.from("tracks").select(TRACK_SELECT).ilike("title", pattern).limit(30),
    supabase.from("tracks").select("*, artist:artists!inner(id, name)").ilike("artist.name", pattern).limit(30),
  ]);
  if (byTitle.error) throw byTitle.error;
  if (byArtist.error) throw byArtist.error;

  const merged = new Map<string, TrackWithArtist>();
  for (const track of [...byTitle.data, ...byArtist.data] as unknown as TrackWithArtist[]) {
    merged.set(track.id, track);
  }
  return Array.from(merged.values()).slice(0, 30);
}

export async function getLikedTrackIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("likes").select("track_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((row) => row.track_id));
}

export async function getTrackLyrics(trackId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lyric_lines")
    .select("id, timestamp_seconds, text")
    .eq("track_id", trackId)
    .order("timestamp_seconds", { ascending: true });
  if (error) throw error;
  return data;
}
