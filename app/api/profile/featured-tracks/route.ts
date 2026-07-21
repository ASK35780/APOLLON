import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FEATURED = 6;

// Replaces the caller's whole set of showcased tracks with `trackIds`,
// order preserved via `position`. Unlike featured badges (a boolean flag on
// pre-existing user_badges rows), profile_featured_tracks rows don't exist
// until a track is featured, so this deletes-then-inserts rather than
// updating in place. RLS (see supabase/migrations/0019_...) restricts both
// to user_id = auth.uid() — a bogus/nonexistent track id just fails the
// tracks foreign key, caught below.
export async function POST(request: Request) {
  const { trackIds } = (await request.json()) as { trackIds?: string[] };
  if (!Array.isArray(trackIds)) {
    return NextResponse.json({ error: "trackIds must be an array" }, { status: 400 });
  }
  if (trackIds.length > MAX_FEATURED) {
    return NextResponse.json({ error: `Maximum ${MAX_FEATURED} titres` }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { error: deleteError } = await supabase.from("profile_featured_tracks").delete().eq("user_id", user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (trackIds.length > 0) {
    const rows = trackIds.map((trackId, position) => ({ user_id: user.id, track_id: trackId, position }));
    const { error: insertError } = await supabase.from("profile_featured_tracks").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
