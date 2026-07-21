import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LiveChatMessageWithSender } from "@/types/database";

const MESSAGE_SELECT = "*, sender:profiles(id, username, display_name, avatar_url)";

export async function getLiveChatMessages(liveShowId: string): Promise<LiveChatMessageWithSender[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("live_chat_messages")
    .select(MESSAGE_SELECT)
    .eq("live_show_id", liveShowId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data as unknown as LiveChatMessageWithSender[];
}

export async function getDonationCount(liveShowId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("live_show_donations")
    .select("id", { count: "exact", head: true })
    .eq("live_show_id", liveShowId);
  if (error) throw error;
  return count ?? 0;
}
