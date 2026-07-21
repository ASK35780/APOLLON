import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { username } = (await request.json()) as { username?: string };
  if (!username?.trim()) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: addressee, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!addressee) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  if (addressee.id === user.id) {
    return NextResponse.json({ error: "Tu ne peux pas t'ajouter toi-même." }, { status: 400 });
  }

  // A request may already exist in either direction (sent by us, or by
  // them) — surface that instead of creating a duplicate/reverse row.
  const { data: existing, error: existingError } = await supabase
    .from("friend_requests")
    .select("id, requester_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addressee.id}),and(requester_id.eq.${addressee.id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Vous êtes déjà amis." }, { status: 409 });
    }
    if (existing.status === "pending") {
      return NextResponse.json(
        {
          error:
            existing.requester_id === user.id
              ? "Demande déjà envoyée."
              : "Cette personne t'a déjà envoyé une demande — regarde tes demandes reçues.",
        },
        { status: 409 }
      );
    }
    // Declined in the same direction before: re-send by resetting that row
    // rather than inserting a duplicate (requester_id, addressee_id) pair.
    if (existing.status === "declined" && existing.requester_id === user.id) {
      const { error: resendError } = await supabase
        .from("friend_requests")
        .update({ status: "pending", responded_at: null, created_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (resendError) return NextResponse.json({ error: resendError.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
  }

  const { error: insertError } = await supabase
    .from("friend_requests")
    .insert({ requester_id: user.id, addressee_id: addressee.id });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
