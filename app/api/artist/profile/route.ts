import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { name, bio, genres, location, label, foundedYear, website, instagramUrl, tiktokUrl, youtubeUrl, spotifyUrl } =
    (await request.json()) as {
      name?: string;
      bio?: string;
      genres?: string[];
      location?: string;
      label?: string;
      foundedYear?: number | null;
      website?: string;
      instagramUrl?: string;
      tiktokUrl?: string;
      youtubeUrl?: string;
      spotifyUrl?: string;
    };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "Le nom d'artiste est requis" }, { status: 400 });
    updates.name = name.trim();
  }
  if (bio !== undefined) updates.bio = bio.trim() || null;
  if (genres !== undefined) updates.genres = genres;
  if (location !== undefined) updates.location = location.trim() || null;
  if (label !== undefined) updates.label = label.trim() || null;
  if (foundedYear !== undefined) {
    if (foundedYear !== null && (foundedYear < 1900 || foundedYear > 2100)) {
      return NextResponse.json({ error: "Année invalide" }, { status: 400 });
    }
    updates.founded_year = foundedYear;
  }
  if (website !== undefined) updates.website = website.trim() || null;
  if (instagramUrl !== undefined) updates.instagram_url = instagramUrl.trim() || null;
  if (tiktokUrl !== undefined) updates.tiktok_url = tiktokUrl.trim() || null;
  if (youtubeUrl !== undefined) updates.youtube_url = youtubeUrl.trim() || null;
  if (spotifyUrl !== undefined) updates.spotify_url = spotifyUrl.trim() || null;

  const { data, error } = await supabase.from("artists").update(updates).eq("owner_id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ artist: data });
}
