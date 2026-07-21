import { NextResponse } from "next/server";
import { searchTracks } from "@/lib/queries/tracks";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json([]);
  const results = await searchTracks(query);
  return NextResponse.json(results);
}
