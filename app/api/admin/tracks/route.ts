import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { admin } = await requireAdmin();
    const { data, error } = await admin
      .from("tracks")
      .select("*, artist:artists(id, name, owner_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tracks: data });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
