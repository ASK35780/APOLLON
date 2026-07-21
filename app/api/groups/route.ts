import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a group, adds the creator as its first (and permanent-admin)
// member, and seeds an empty listening session row. Three inserts against
// the caller's own RLS-scoped session — each is individually allowed by the
// policies in supabase/migrations/0005_friend_groups.sql because the prior
// insert is already visible within the same transaction-less request
// (Postgres sees the committed friend_groups row before the next statement).
export async function POST(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: group, error: groupError } = await supabase
    .from("friend_groups")
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single();
  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  const { error: memberError } = await supabase
    .from("friend_group_members")
    .insert({ group_id: group.id, user_id: user.id });
  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const { error: sessionError } = await supabase.from("friend_group_sessions").insert({ group_id: group.id });
  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({ group });
}
