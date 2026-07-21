import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Polled by the client after returning from Stripe Checkout (see
// components/Paywall.tsx) since the webhook that actually unlocks the show
// runs asynchronously and may land a beat after the redirect.
export async function GET(request: Request) {
  const liveShowId = new URL(request.url).searchParams.get("liveShowId");
  if (!liveShowId) {
    return NextResponse.json({ error: "liveShowId is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ unlocked: false }, { status: 401 });
  }

  const { data } = await supabase
    .from("live_show_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("live_show_id", liveShowId)
    .maybeSingle();

  return NextResponse.json({ unlocked: Boolean(data) });
}
