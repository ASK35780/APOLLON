-- 1:1 direct messages between accepted friends, with optional track sharing.
-- conversation_key lets both participants' clients subscribe to one
-- Realtime filter regardless of who's sender/recipient on a given row.
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  conversation_key text generated always as (
    least(sender_id::text, recipient_id::text) || '_' || greatest(sender_id::text, recipient_id::text)
  ) stored,
  body text,
  shared_track_id uuid references tracks (id) on delete set null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  check (body is not null or shared_track_id is not null)
);
create index direct_messages_conversation_idx on direct_messages (conversation_key, created_at);

alter table direct_messages enable row level security;

create policy "participants view their messages" on direct_messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Only accepted friends can message each other — mirrors the friend-request
-- relationship rather than opening DMs to anyone on the platform.
create policy "friends can message each other" on direct_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.requester_id = auth.uid() and fr.addressee_id = direct_messages.recipient_id)
          or (fr.addressee_id = auth.uid() and fr.requester_id = direct_messages.recipient_id)
        )
    )
  );

alter publication supabase_realtime add table direct_messages;
