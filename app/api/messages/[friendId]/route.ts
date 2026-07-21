import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversation } from "@/lib/queries/messages";

export async function GET(_request: Request, { params }: { params: { friendId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const messages = await getConversation(user.id, params.friendId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: { friendId: string } }) {
  const { body, sharedTrackId } = (await request.json()) as { body?: string; sharedTrackId?: string };
  const trimmedBody = body?.trim() || null;
  if (!trimmedBody && !sharedTrackId) {
    return NextResponse.json({ error: "Un message ou un titre partagé est requis" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: user.id,
      recipient_id: params.friendId,
      body: trimmedBody,
      shared_track_id: sharedTrackId ?? null,
    })
    .select("*, shared_track:tracks(*, artist:artists(id, name))")
    .single();
  if (error) {
    // RLS blocks this insert when the two accounts aren't accepted friends.
    return NextResponse.json({ error: "Vous devez être amis pour échanger des messages." }, { status: 403 });
  }

  return NextResponse.json({ message: data });
}
