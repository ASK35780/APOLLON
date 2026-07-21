import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { admin } = await requireAdmin();
    const { data, error } = await admin
      .from("subtitle_submissions")
      .select("*, track:tracks(id, title), submitter:profiles!subtitle_submissions_submitted_by_fkey(username, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ submissions: data });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
