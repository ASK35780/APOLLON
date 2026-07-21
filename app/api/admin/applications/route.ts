import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { admin } = await requireAdmin();
    const { data, error } = await admin
      .from("artist_applications")
      .select("*, applicant:profiles!artist_applications_user_id_fkey(username, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ applications: data });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
