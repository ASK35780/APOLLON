// Shared by both the server-side query (lib/queries/messages.ts) and the
// client-side Realtime subscription (components/DirectMessageOverlay.tsx) —
// deliberately has no "server-only" import so both sides can pull it in.
// Must match the generated `conversation_key` column exactly — see
// supabase/migrations/0015_direct_messages.sql.
export function conversationKey(userId: string, friendId: string): string {
  return [userId, friendId].sort().join("_");
}
