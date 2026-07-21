import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Single hardcoded admin account: only this email can approve/reject
// candidatures, uploads and subtitle submissions, or add/delete content on
// any account. Checked against the session's own auth.getUser() email —
// never trust a client-supplied value.
export const ADMIN_EMAIL = "lucas.goudey35@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

export class AdminAuthError extends Error {}

// Verifies the current session belongs to the admin account and returns a
// service-role client (bypasses RLS — every admin route needs to read/write
// rows it doesn't own) plus the admin's own profile id for audit logging.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new AdminAuthError("Accès réservé à l'administrateur");
  }
  return { adminId: user.id, admin: createAdminClient() };
}

// Total pending items across the three moderation queues — used to badge
// the "Administration" entry point on the admin's own profile so requests
// are actually noticed, not just reachable. Callers must already know the
// requester is the admin (see isAdminEmail) — this uses the service-role
// client and reads across all users' data.
export async function getPendingCounts(admin: SupabaseClient): Promise<number> {
  const [apps, tracks, subs] = await Promise.all([
    admin.from("artist_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("tracks").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("subtitle_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (apps.count ?? 0) + (tracks.count ?? 0) + (subs.count ?? 0);
}

export async function logAdminAction(
  admin: SupabaseClient,
  params: {
    adminId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    targetUserId?: string | null;
    reason: string;
  }
) {
  const { error } = await admin.from("admin_actions").insert({
    admin_id: params.adminId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    target_user_id: params.targetUserId ?? null,
    reason: params.reason,
  });
  if (error) throw error;
}
