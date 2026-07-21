import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLiveChatMessages } from "@/lib/queries/live-chat";

export async function GET(_request: Request, { params }: { params: { liveShowId: string } }) {
  const messages = await getLiveChatMessages(params.liveShowId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: { liveShowId: string } }) {
  const { body } = (await request.json()) as { body?: string };
  const trimmed = body?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connecte-toi pour discuter." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("live_chat_messages")
    .insert({ live_show_id: params.liveShowId, user_id: user.id, body: trimmed })
    .select("*, sender:profiles(id, username, display_name, avatar_url)")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}
