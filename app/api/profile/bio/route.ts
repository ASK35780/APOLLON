import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BIO = 240;

export async function POST(request: Request) {
  const { bio } = (await request.json()) as { bio?: string };
  const trimmed = (bio ?? "").trim();

  if (trimmed.length > MAX_BIO) {
    return NextResponse.json({ error: `La bio doit faire ${MAX_BIO} caractères maximum.` }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bio: trimmed || null })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bio: trimmed || null });
}
