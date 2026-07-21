import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchUsersByUsername } from "@/lib/queries/groups";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json([]);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const results = await searchUsersByUsername(query, user.id);
  return NextResponse.json(results);
}
