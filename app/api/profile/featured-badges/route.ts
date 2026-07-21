import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FEATURED = 6;

// Replaces the caller's whole set of showcased badges with `badgeIds`.
// RLS (see supabase/migrations/0003_...) restricts both updates to rows
// where user_id = auth.uid(), so a user can only ever feature their own
// already-unlocked badges — passing someone else's or a locked badge id
// simply matches zero rows.
export async function POST(request: Request) {
  const { badgeIds } = (await request.json()) as { badgeIds?: string[] };
  if (!Array.isArray(badgeIds)) {
    return NextResponse.json({ error: "badgeIds must be an array" }, { status: 400 });
  }
  if (badgeIds.length > MAX_FEATURED) {
    return NextResponse.json({ error: `Maximum ${MAX_FEATURED} badges` }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { error: clearError } = await supabase
    .from("user_badges")
    .update({ featured: false })
    .eq("user_id", user.id);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  if (badgeIds.length > 0) {
    const { error: setError } = await supabase
      .from("user_badges")
      .update({ featured: true })
      .eq("user_id", user.id)
      .in("badge_id", badgeIds);
    if (setError) {
      return NextResponse.json({ error: setError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
