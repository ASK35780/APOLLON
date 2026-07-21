import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlaylists } from "@/lib/queries/playlists";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ playlists: [] });
  }
  const playlists = await getUserPlaylists(user.id);
  return NextResponse.json({ playlists });
}

export async function POST(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: playlist, error } = await supabase
    .from("playlists")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ playlist });
}
