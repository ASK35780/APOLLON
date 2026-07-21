import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlaylistWithTracks } from "@/lib/queries/playlists";

export async function GET(_request: Request, { params }: { params: { playlistId: string } }) {
  // RLS on the underlying tables (playlists visible if public or owned)
  // means a private playlist that isn't the caller's own just comes back
  // null here, same as a nonexistent id.
  const playlist = await getPlaylistWithTracks(params.playlistId);
  if (!playlist) {
    return NextResponse.json({ error: "Playlist introuvable" }, { status: 404 });
  }
  return NextResponse.json({ playlist });
}

export async function DELETE(_request: Request, { params }: { params: { playlistId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // RLS ("users delete own playlists") makes this a no-op for anyone else's
  // playlist rather than an error, so check first for a clean 403.
  const { data: playlist } = await supabase.from("playlists").select("owner_id").eq("id", params.playlistId).maybeSingle();
  if (!playlist || playlist.owner_id !== user.id) {
    return NextResponse.json({ error: "Tu ne peux supprimer que tes propres playlists." }, { status: 403 });
  }

  const { error } = await supabase.from("playlists").delete().eq("id", params.playlistId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
