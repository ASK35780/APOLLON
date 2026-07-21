import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  const { trackId } = (await request.json()) as { trackId?: string };
  if (!trackId) {
    return NextResponse.json({ error: "trackId requis" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: existingRows, error: countError } = await supabase
    .from("playlist_tracks")
    .select("position")
    .eq("playlist_id", params.playlistId)
    .order("position", { ascending: false })
    .limit(1);
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  const nextPosition = (existingRows?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from("playlist_tracks")
    .insert({ playlist_id: params.playlistId, track_id: trackId, position: nextPosition });
  if (error) {
    // Already in the playlist (primary key clash), or RLS rejected because
    // this isn't the caller's playlist.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce titre est déjà dans la playlist." }, { status: 409 });
    }
    return NextResponse.json({ error: "Impossible d'ajouter ce titre à cette playlist." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
