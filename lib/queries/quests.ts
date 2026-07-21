import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Quest, QuestWithProgress } from "@/types/database";

const QUEST_SELECT = "*, badge:badges(slug, name)";

// Mirrors current_quest_period()'s 'IYYY-"W"IW' format — used only to check
// "already claimed this period" for display; the actual claim always goes
// through the DB function, so a rare edge-case mismatch here just means a
// quest briefly shows as claimable again next reload, not a security issue.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function getQuestsWithProgress(userId: string): Promise<QuestWithProgress[]> {
  const supabase = createClient();
  const { data: quests, error } = await supabase
    .from("quests")
    .select(QUEST_SELECT)
    .order("scope", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const list = (quests ?? []) as unknown as (Quest & { badge: { slug: string; name: string } | null })[];
  const weekKey = isoWeekKey(new Date());

  const [progressResults, completionsResult] = await Promise.all([
    Promise.all(list.map((q) => supabase.rpc("quest_progress", { p_quest_id: q.id }))),
    supabase.from("user_quest_completions").select("quest_id, period_key").eq("user_id", userId),
  ]);
  if (completionsResult.error) throw completionsResult.error;

  const completions = completionsResult.data ?? [];
  const completedSet = new Set(completions.map((c) => `${c.quest_id}:${c.period_key}`));
  const everCompletedSet = new Set(completions.map((c) => c.quest_id));

  return list.map((q, i) => {
    const progress = (progressResults[i]?.data as number | null) ?? 0;
    const periodKey = q.scope === "hebdomadaire" ? weekKey : "lifetime";
    return {
      ...q,
      progress,
      completed: completedSet.has(`${q.id}:${periodKey}`),
      everCompleted: everCompletedSet.has(q.id),
      periodKey,
    };
  });
}
