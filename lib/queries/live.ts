import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LiveShowWithArtist } from "@/types/database";

const LIVE_SHOW_SELECT = "*, artist:artists(id, name)";

export async function getLiveShows() {
  const supabase = createClient();
  const [{ data: now, error: nowError }, { data: upcoming, error: upcomingError }] = await Promise.all([
    supabase.from("live_shows").select(LIVE_SHOW_SELECT).eq("status", "live").order("viewer_count", { ascending: false }),
    supabase.from("live_shows").select(LIVE_SHOW_SELECT).eq("status", "upcoming").order("scheduled_at", { ascending: true }),
  ]);
  if (nowError) throw nowError;
  if (upcomingError) throw upcomingError;
  return {
    now: now as unknown as LiveShowWithArtist[],
    upcoming: upcoming as unknown as LiveShowWithArtist[],
  };
}

export async function getUnlockedLiveShowIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("live_show_purchases").select("live_show_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((row) => row.live_show_id));
}
