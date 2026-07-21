import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { inviteId: string } }) {
  const { accept } = (await request.json()) as { accept?: boolean };
  if (typeof accept !== "boolean") {
    return NextResponse.json({ error: "accept must be a boolean" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: invite, error: inviteError } = await supabase
    .from("friend_group_invites")
    .select("group_id, invited_user_id, status")
    .eq("id", params.inviteId)
    .maybeSingle();
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }
  if (!invite || invite.invited_user_id !== user.id) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Cette invitation a déjà été traitée." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("friend_group_invites")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", params.inviteId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (accept) {
    const { error: joinError } = await supabase
      .from("friend_group_members")
      .insert({ group_id: invite.group_id, user_id: user.id });
    if (joinError) {
      return NextResponse.json({ error: joinError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, groupId: invite.group_id });
}
