import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Toggle a like on a track for the current user. RLS restricts likes to
// rows owned by auth.uid(), so no extra ownership check is needed here.
export async function POST(request: Request) {
  const { trackId } = (await request.json()) as { trackId?: string };
  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("likes")
    .select("track_id")
    .eq("user_id", user.id)
    .eq("track_id", trackId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("track_id", trackId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: false });
  }

  const { error } = await supabase.from("likes").insert({ user_id: user.id, track_id: trackId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ liked: true });
}
