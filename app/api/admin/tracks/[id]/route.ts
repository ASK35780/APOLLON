import { NextResponse } from "next/server";
import { AdminAuthError, logAdminAction, requireAdmin } from "@/lib/admin";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { adminId, admin } = await requireAdmin();
    const { decision, reason, edits } = (await request.json()) as {
      decision?: "approve" | "reject";
      reason?: string;
      edits?: { title?: string };
    };
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Un motif est requis" }, { status: 400 });
    }

    const { data: track, error: fetchError } = await admin
      .from("tracks")
      .select("id, artist:artists(owner_id)")
      .eq("id", params.id)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

    const status = decision === "approve" ? "approved" : "rejected";
    const updates: Record<string, unknown> = { status };
    if (edits?.title?.trim()) updates.title = edits.title.trim();
    const { error: updateError } = await admin.from("tracks").update(updates).eq("id", params.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    const owner = Array.isArray(track.artist) ? track.artist[0] : track.artist;
    await logAdminAction(admin, {
      adminId,
      action: decision === "approve" ? "approve_track" : "reject_track",
      entityType: "track",
      entityId: params.id,
      targetUserId: owner?.owner_id ?? null,
      reason: reason.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}

// Deletes any track (approved or not) — the "supprimer du contenu sur
// n'importe quel compte" admin power. Always requires a reason, logged for
// the audit trail.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { adminId, admin } = await requireAdmin();
    const { reason } = (await request.json()) as { reason?: string };
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Un motif est requis" }, { status: 400 });
    }

    const { data: track, error: fetchError } = await admin
      .from("tracks")
      .select("id, title, artist:artists(owner_id)")
      .eq("id", params.id)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

    const { error: deleteError } = await admin.from("tracks").delete().eq("id", params.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const owner = Array.isArray(track.artist) ? track.artist[0] : track.artist;
    await logAdminAction(admin, {
      adminId,
      action: "delete_track",
      entityType: "track",
      entityId: params.id,
      targetUserId: owner?.owner_id ?? null,
      reason: reason.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
