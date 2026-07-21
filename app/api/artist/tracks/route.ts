import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubtitleLine } from "@/types/database";

// The audio/video file itself is uploaded directly from the browser to
// Supabase Storage (see components/BecomeArtistOverlay.tsx) — serverless
// function bodies have a small size limit, so this route only ever receives
// the resulting metadata and creates the (pending) track row.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { title, audioUrl, durationSeconds, mediaType, subtitles } = (await request.json()) as {
    title?: string;
    audioUrl?: string;
    durationSeconds?: number;
    mediaType?: "audio" | "video";
    subtitles?: SubtitleLine[];
  };
  if (!title?.trim()) return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
  if (!audioUrl) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!durationSeconds || durationSeconds <= 0) {
    return NextResponse.json({ error: "Durée invalide" }, { status: 400 });
  }
  if (mediaType !== "audio" && mediaType !== "video") {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("id, cover_c1, cover_c2, cover_pattern")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (artistError) return NextResponse.json({ error: artistError.message }, { status: 500 });
  if (!artist) return NextResponse.json({ error: "Tu n'as pas encore de profil artiste" }, { status: 403 });

  const { data: track, error } = await supabase
    .from("tracks")
    .insert({
      title: title.trim(),
      artist_id: artist.id,
      duration_seconds: Math.round(durationSeconds),
      audio_url: audioUrl,
      media_type: mediaType,
      cover_c1: artist.cover_c1,
      cover_c2: artist.cover_c2,
      cover_pattern: artist.cover_pattern,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional: the artist can propose subtitles for their own track right
  // away. Still goes through the same moderation queue as anyone else's
  // proposals — see app/api/admin/subtitles/[id]/route.ts.
  if (Array.isArray(subtitles) && subtitles.length > 0) {
    const cleanLines = subtitles
      .filter((l) => typeof l?.text === "string" && l.text.trim() && typeof l.timestamp_seconds === "number")
      .map((l) => ({ timestamp_seconds: Math.max(0, Math.round(l.timestamp_seconds)), text: l.text.trim() }))
      .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    if (cleanLines.length > 0) {
      await supabase.from("subtitle_submissions").insert({
        track_id: track.id,
        submitted_by: user.id,
        lines: cleanLines,
      });
    }
  }

  return NextResponse.json({ track });
}
