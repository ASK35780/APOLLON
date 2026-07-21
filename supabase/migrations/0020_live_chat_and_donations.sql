-- Twitch-style live chat + a lightweight "donations" counter (hearts sent
-- during a live show) for the live watch view. No real payment involved —
-- this replaces the old purely-decorative "Envoyer un cœur" button with a
-- persisted, counted action.

create table live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  live_show_id uuid not null references live_shows (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index live_chat_messages_show_idx on live_chat_messages (live_show_id, created_at);

alter table live_chat_messages enable row level security;

create policy "live chat is publicly readable"
  on live_chat_messages for select using (true);

create policy "signed-in users can send live chat"
  on live_chat_messages for insert with check (auth.uid() = user_id);

create table live_show_donations (
  id uuid primary key default gen_random_uuid(),
  live_show_id uuid not null references live_shows (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index live_show_donations_show_idx on live_show_donations (live_show_id);

alter table live_show_donations enable row level security;

create policy "live donations are publicly readable"
  on live_show_donations for select using (true);

create policy "signed-in users can send donations"
  on live_show_donations for insert with check (auth.uid() = user_id);

alter publication supabase_realtime add table live_chat_messages;
alter publication supabase_realtime add table live_show_donations;
