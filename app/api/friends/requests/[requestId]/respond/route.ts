import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { requestId: string } }) {
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

  const { data: friendRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("addressee_id, status")
    .eq("id", params.requestId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!friendRequest || friendRequest.addressee_id !== user.id) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }
  if (friendRequest.status !== "pending") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", params.requestId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
