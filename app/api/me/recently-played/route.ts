import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecentlyPlayed } from "@/lib/queries/history";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ tracks: [] });
  }
  const tracks = await getRecentlyPlayed(user.id);
  return NextResponse.json({ tracks });
}
