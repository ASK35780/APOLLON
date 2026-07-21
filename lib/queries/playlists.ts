import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Playlist, PlaylistWithTracks } from "@/types/database";

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// RLS (playlists visible if public or owned) means this naturally returns
// null for a private playlist that isn't the caller's own — no separate
// ownership check needed here.
export async function getPlaylistWithTracks(playlistId: string): Promise<PlaylistWithTracks | null> {
  const supabase = createClient();
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .maybeSingle();
  if (playlistError) throw playlistError;
  if (!playlist) return null;

  const { data: rows, error: tracksError } = await supabase
    .from("playlist_tracks")
    .select("position, track:tracks(*, artist:artists(id, name))")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });
  if (tracksError) throw tracksError;

  return { ...playlist, tracks: (rows ?? []).map((r) => r.track) } as unknown as PlaylistWithTracks;
}
