import { NextResponse } from "next/server";
import { AdminAuthError, logAdminAction, requireAdmin } from "@/lib/admin";
import type { SubtitleLine } from "@/types/database";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { adminId, admin } = await requireAdmin();
    const { decision, reason, edits } = (await request.json()) as {
      decision?: "approve" | "reject";
      reason?: string;
      edits?: { lines?: SubtitleLine[] };
    };
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Un motif est requis" }, { status: 400 });
    }

    const { data: submission, error: fetchError } = await admin
      .from("subtitle_submissions")
      .select("id, track_id, submitted_by, lines")
      .eq("id", params.id)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

    // The admin's edited lines (if provided) replace the submitted ones —
    // both for what gets published and what's recorded on the submission.
    const finalLines = edits?.lines && edits.lines.length > 0 ? edits.lines : (submission.lines as SubtitleLine[]);

    if (decision === "approve") {
      const lines = finalLines;
      const { error: deleteError } = await admin.from("lyric_lines").delete().eq("track_id", submission.track_id);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

      if (lines.length > 0) {
        const { error: insertError } = await admin.from("lyric_lines").insert(
          lines.map((line) => ({
            track_id: submission.track_id,
            timestamp_seconds: line.timestamp_seconds,
            text: line.text,
          }))
        );
        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const status = decision === "approve" ? "approved" : "rejected";
    const updates: Record<string, unknown> = { status, admin_note: reason.trim(), reviewed_at: new Date().toISOString() };
    if (edits?.lines && edits.lines.length > 0) updates.lines = finalLines;
    const { error: updateError } = await admin.from("subtitle_submissions").update(updates).eq("id", params.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await logAdminAction(admin, {
      adminId,
      action: decision === "approve" ? "approve_subtitles" : "reject_subtitles",
      entityType: "subtitle_submission",
      entityId: params.id,
      targetUserId: submission.submitted_by,
      reason: reason.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }
}
