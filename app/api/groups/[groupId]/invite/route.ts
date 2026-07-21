import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Invites a user to the group by exact @username. Any current member can
// invite (see supabase/migrations/0005_friend_groups.sql); the invited user
// must accept before actually joining (app/api/groups/invites/[inviteId]/respond).
export async function POST(request: Request, { params }: { params: { groupId: string } }) {
  const { username } = (await request.json()) as { username?: string };
  if (!username || !username.trim()) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: invitedProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!invitedProfile) {
    return NextResponse.json({ error: "Aucun utilisateur avec ce pseudo." }, { status: 404 });
  }
  if (invitedProfile.id === user.id) {
    return NextResponse.json({ error: "Tu ne peux pas t'inviter toi-même." }, { status: 400 });
  }

  const { data: existingMember } = await supabase
    .from("friend_group_members")
    .select("user_id")
    .eq("group_id", params.groupId)
    .eq("user_id", invitedProfile.id)
    .maybeSingle();
  if (existingMember) {
    return NextResponse.json({ error: "Cette personne fait déjà partie du groupe." }, { status: 409 });
  }

  const { error: inviteError } = await supabase.from("friend_group_invites").insert({
    group_id: params.groupId,
    invited_user_id: invitedProfile.id,
    invited_by: user.id,
    status: "pending",
  });
  if (inviteError) {
    // Unique violation: an invite (pending, accepted, or declined) already exists.
    if (inviteError.code === "23505") {
      return NextResponse.json({ error: "Une invitation existe déjà pour cette personne." }, { status: 409 });
    }
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
