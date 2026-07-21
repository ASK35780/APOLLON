import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// "Pseudo principal" (display_name, shown big) and "pseudo secondaire"
// (username, shown as @handle). Kept intentionally permissive on
// display_name (any non-empty string). Username follows a handle-style
// format, but allows "+" and a generous length — the signup trigger
// (handle_new_user() in 0001_init.sql) defaults it to the email's local
// part, which commonly contains "+" (e.g. address tagging) and can run
// longer than a typical hand-picked handle.
const USERNAME_RE = /^[a-zA-Z0-9._+-]{3,40}$/;
const MAX_DISPLAY_NAME = 40;

export async function POST(request: Request) {
  const { displayName, username } = (await request.json()) as { displayName?: string; username?: string };

  const trimmedName = (displayName ?? "").trim();
  const trimmedUsername = (username ?? "").trim();

  if (!trimmedName || trimmedName.length > MAX_DISPLAY_NAME) {
    return NextResponse.json({ error: `Le pseudo principal doit faire entre 1 et ${MAX_DISPLAY_NAME} caractères.` }, { status: 400 });
  }
  if (!USERNAME_RE.test(trimmedUsername)) {
    return NextResponse.json(
      { error: "L'identifiant doit faire 3 à 40 caractères (lettres, chiffres, points, tirets, +, underscores)." },
      { status: 400 }
    );
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
    .update({ display_name: trimmedName, username: trimmedUsername })
    .eq("id", user.id);

  if (error) {
    // Postgres unique_violation on the `username` column.
    if (error.code === "23505") {
      return NextResponse.json({ error: "Cet identifiant est déjà pris." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, displayName: trimmedName, username: trimmedUsername });
}
