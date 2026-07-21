import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDonationCount } from "@/lib/queries/live-chat";

export async function GET(_request: Request, { params }: { params: { liveShowId: string } }) {
  const count = await getDonationCount(params.liveShowId);
  return NextResponse.json({ count });
}

// One heart sent = one donation row. No real payment — see
// supabase/migrations/0020_live_chat_and_donations.sql.
export async function POST(_request: Request, { params }: { params: { liveShowId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connecte-toi pour envoyer un don." }, { status: 401 });
  }

  const { error } = await supabase
    .from("live_show_donations")
    .insert({ live_show_id: params.liveShowId, user_id: user.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
