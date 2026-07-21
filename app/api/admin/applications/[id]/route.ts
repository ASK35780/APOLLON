import { NextResponse } from "next/server";
import { AdminAuthError, logAdminAction, requireAdmin } from "@/lib/admin";

interface ApplicationEdits {
  artistName?: string;
  genres?: string[];
  bio?: string;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { adminId, admin } = await requireAdmin();
    const { decision, reason, edits } = (await request.json()) as {
      decision?: "approve" | "reject";
      reason?: string;
      edits?: ApplicationEdits;
    };
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Un motif est requis" }, { status: 400 });
    }

    const { data: application, error: fetchError } = await admin
      .from("artist_applications")
      .select("id, user_id, artist_id")
      .eq("id", params.id)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

    // Edits (if any) are applied regardless of the decision — correcting a
    // typo shouldn't require rejecting the whole application.
    if (edits && (edits.artistName?.trim() || edits.bio !== undefined || edits.genres)) {
      const appUpdates: Record<string, unknown> = {};
      const artistUpdates: Record<string, unknown> = {};
      if (edits.artistName?.trim()) {
        appUpdates.artist_name = edits.artistName.trim();
        artistUpdates.name = edits.artistName.trim();
      }
      if (edits.genres) {
        appUpdates.genres = edits.genres;
        artistUpdates.genres = edits.genres;
      }
      if (edits.bio !== undefined) {
        appUpdates.bio = edits.bio.trim() || null;
        artistUpdates.bio = edits.bio.trim() || null;
      }
      if (Object.keys(appUpdates).length > 0) {
        const { error: editAppError } = await admin.from("artist_applications").update(appUpdates).eq("id", params.id);
        if (editAppError) return NextResponse.json({ error: editAppError.message }, { status: 500 });
      }
      if (application.artist_id && Object.keys(artistUpdates).length > 0) {
        const { error: editArtistError } = await admin.from("artists").update(artistUpdates).eq("id", application.artist_id);
        if (editArtistError) return NextResponse.json({ error: editArtistError.message }, { status: 500 });
      }
    }

    const status = decision === "approve" ? "approved" : "rejected";
    const { error: updateAppError } = await admin
      .from("artist_applications")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", params.id);
    if (updateAppError) return NextResponse.json({ error: updateAppError.message }, { status: 500 });

    if (application.artist_id) {
      const { error: updateArtistError } = await admin
        .from("artists")
        .update({ status })
        .eq("id", application.artist_id);
      if (updateArtistError) return NextResponse.json({ error: updateArtistError.message }, { status: 500 });
    }

    await logAdminAction(admin, {
      adminId,
      action: decision === "approve" ? "approve_artist_application" : "reject_artist_application",
      entityType: "artist_application",
      entityId: params.id,
      targetUserId: application.user_id,
      reason: reason.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
