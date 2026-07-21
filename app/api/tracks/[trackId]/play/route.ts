import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Logs a play for the artist dashboard's "lectures" stat. Works for guests
// too (user_id null) — RLS only restricts who can read these rows, not who
// can log one.
export async function POST(_request: Request, { params }: { params: { trackId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("track_plays").insert({ track_id: params.trackId, user_id: user?.id ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
