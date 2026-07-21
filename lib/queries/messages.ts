import "server-only";
import { createClient } from "@/lib/supabase/server";
import { conversationKey } from "@/lib/conversation-key";
import type { DirectMessageWithTrack } from "@/types/database";

const MESSAGE_SELECT = "*, shared_track:tracks(*, artist:artists(id, name))";

export async function getConversation(userId: string, friendId: string): Promise<DirectMessageWithTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("direct_messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_key", conversationKey(userId, friendId))
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data as unknown as DirectMessageWithTrack[];
}
