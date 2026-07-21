import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates the artist profile right away (status "pending") so the applicant
// can start editing their profile and uploading tracks immediately, but
// nothing is publicly visible until the admin approves the application —
// see app/api/admin/applications/[id]/route.ts.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { artistName, genres, bio, motivation } = (await request.json()) as {
    artistName?: string;
    genres?: string[];
    bio?: string;
    motivation?: string;
  };
  if (!artistName?.trim()) {
    return NextResponse.json({ error: "Le nom d'artiste est requis" }, { status: 400 });
  }

  const { data: existing } = await supabase.from("artists").select("id").eq("owner_id", user.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Tu as déjà un profil artiste" }, { status: 409 });
  }

  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .insert({
      owner_id: user.id,
      name: artistName.trim(),
      bio: bio?.trim() || null,
      genres: genres ?? [],
    })
    .select()
    .single();
  if (artistError) return NextResponse.json({ error: artistError.message }, { status: 500 });

  const { error: applicationError } = await supabase.from("artist_applications").insert({
    user_id: user.id,
    artist_id: artist.id,
    artist_name: artistName.trim(),
    genres: genres ?? [],
    bio: bio?.trim() || null,
    motivation: motivation?.trim() || null,
  });
  if (applicationError) return NextResponse.json({ error: applicationError.message }, { status: 500 });

  return NextResponse.json({ artist });
}
