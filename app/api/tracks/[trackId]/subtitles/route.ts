import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubtitleLine } from "@/types/database";

// Anyone signed in can propose subtitles for any track, but the lines only
// reach the publicly-visible lyric_lines table once the admin approves the
// submission — see app/api/admin/subtitles/[id]/route.ts.
export async function POST(request: Request, { params }: { params: { trackId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { lines } = (await request.json()) as { lines?: SubtitleLine[] };
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Ajoute au moins une ligne de sous-titre" }, { status: 400 });
  }

  const cleanLines = lines
    .filter((l) => typeof l?.text === "string" && l.text.trim() && typeof l.timestamp_seconds === "number")
    .map((l) => ({ timestamp_seconds: Math.max(0, Math.round(l.timestamp_seconds)), text: l.text.trim() }))
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
  if (cleanLines.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide" }, { status: 400 });
  }

  const { error } = await supabase.from("subtitle_submissions").insert({
    track_id: params.trackId,
    submitted_by: user.id,
    lines: cleanLines,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
