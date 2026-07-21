import { NextResponse } from "next/server";
import { AdminAuthError, logAdminAction, requireAdmin } from "@/lib/admin";

// Deletes any artist profile (and cascades their tracks — see
// tracks.artist_id's ON DELETE CASCADE). Always requires a reason.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { adminId, admin } = await requireAdmin();
    const { reason } = (await request.json()) as { reason?: string };
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Un motif est requis" }, { status: 400 });
    }

    const { data: artist, error: fetchError } = await admin
      .from("artists")
      .select("id, owner_id")
      .eq("id", params.id)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

    const { error: deleteError } = await admin.from("artists").delete().eq("id", params.id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    await logAdminAction(admin, {
      adminId,
      action: "delete_artist",
      entityType: "artist",
      entityId: params.id,
      targetUserId: artist.owner_id,
      reason: reason.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
