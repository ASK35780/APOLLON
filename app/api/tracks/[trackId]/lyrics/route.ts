import { NextResponse } from "next/server";
import { getTrackLyrics } from "@/lib/queries/tracks";

export async function GET(_request: Request, { params }: { params: { trackId: string } }) {
  const lyrics = await getTrackLyrics(params.trackId);
  return NextResponse.json(lyrics);
}
