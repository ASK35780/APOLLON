import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const { body } = (await request.json()) as { body?: string };
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: message, error } = await supabase
    .from("friend_group_messages")
    .insert({ group_id: params.groupId, user_id: user.id, body: body.trim().slice(0, 500) })
    .select("*, sender:profiles(id, username, display_name, avatar_url)")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message });
}

// Called by the last client to leave the room's Realtime presence (see
// lib/useGroupRoomChannel.ts) — chat is ephemeral per listening session,
// only the shared playlist and membership persist. Uses the service-role
// client because there's intentionally no user-facing DELETE policy on
// friend_group_messages (see supabase/migrations/0005_friend_groups.sql).
export async function DELETE(request: Request, { params }: { params: { groupId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("friend_group_members")
    .select("user_id")
    .eq("group_id", params.groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("friend_group_messages").delete().eq("group_id", params.groupId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
