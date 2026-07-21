import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The real check happens in the DB (see the RLS insert policy on
// user_quest_completions, which calls quest_progress() itself) — this route
// just resolves the current period key and reports a friendly error if the
// insert is rejected (target not reached yet, or already claimed).
export async function POST(_request: Request, { params }: { params: { questId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id, scope, reward_badge_id")
    .eq("id", params.questId)
    .maybeSingle();
  if (questError) return NextResponse.json({ error: questError.message }, { status: 500 });
  if (!quest) return NextResponse.json({ error: "Quête introuvable." }, { status: 404 });

  const { data: periodKey, error: periodError } = await supabase.rpc("current_quest_period", { p_scope: quest.scope });
  if (periodError) return NextResponse.json({ error: periodError.message }, { status: 500 });

  const { error: insertError } = await supabase
    .from("user_quest_completions")
    .insert({ user_id: user.id, quest_id: quest.id, period_key: periodKey as string });
  if (insertError) {
    return NextResponse.json({ error: "Objectif pas encore atteint, ou déjà réclamé." }, { status: 403 });
  }

  if (quest.reward_badge_id) {
    // Best-effort — ignore a conflict if the badge was already unlocked.
    await supabase.from("user_badges").insert({ user_id: user.id, badge_id: quest.reward_badge_id });
  }

  return NextResponse.json({ ok: true });
}
