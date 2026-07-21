import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getArtistById,
  getArtistMonthlyListeners,
  getArtistTotalPlays,
  getArtistTracks,
  getArtistVerifiedStatus,
} from "@/lib/queries/artist";
import { getArtistFollowerCount, isFollowingArtist } from "@/lib/queries/follows";

export async function GET(_request: Request, { params }: { params: { artistId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const artist = await getArtistById(params.artistId);
  if (!artist) {
    return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
  }

  const [tracks, followerCount, isFollowing, verified, monthlyListeners, totalPlays] = await Promise.all([
    getArtistTracks(params.artistId),
    getArtistFollowerCount(params.artistId),
    user ? isFollowingArtist(user.id, params.artistId) : Promise.resolve(false),
    getArtistVerifiedStatus(artist.owner_id),
    getArtistMonthlyListeners(params.artistId),
    getArtistTotalPlays(params.artistId),
  ]);

  return NextResponse.json({ artist, tracks, followerCount, isFollowing, verified, monthlyListeners, totalPlays });
}
