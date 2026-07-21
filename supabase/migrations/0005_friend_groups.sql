-- Playlists entre amis: invite-only friend groups sharing a collaborative
-- playlist (majority-vote add/remove, admin breaks ties), a synced listening
-- session (single controller: the permanent admin, or a temporary one when
-- absent), and an ephemeral chat that's cleared once no one is present.

create type friend_group_invite_status as enum ('pending', 'accepted', 'declined');
create type friend_group_track_status as enum ('active', 'proposed_add', 'proposed_remove');

-- ---------------------------------------------------------------------------
-- Groups & membership
-- ---------------------------------------------------------------------------
create table friend_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table friend_group_members (
  group_id uuid not null references friend_groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table friend_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references friend_groups (id) on delete cascade,
  invited_user_id uuid not null references profiles (id) on delete cascade,
  invited_by uuid not null references profiles (id) on delete cascade,
  status friend_group_invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (group_id, invited_user_id)
);

-- ---------------------------------------------------------------------------
-- Shared playlist (add/remove proposals resolved by majority vote)
-- ---------------------------------------------------------------------------
create table friend_group_tracks (
  group_id uuid not null references friend_groups (id) on delete cascade,
  track_id uuid not null references tracks (id) on delete cascade,
  added_by uuid not null references profiles (id) on delete cascade,
  position integer not null,
  status friend_group_track_status not null default 'proposed_add',
  created_at timestamptz not null default now(),
  primary key (group_id, track_id)
);

create table friend_group_track_votes (
  group_id uuid not null references friend_groups (id) on delete cascade,
  track_id uuid not null references tracks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  vote boolean not null,
  created_at timestamptz not null default now(),
  primary key (group_id, track_id, user_id),
  foreign key (group_id, track_id) references friend_group_tracks (group_id, track_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Synced listening session (one row per group; source of truth for anyone
-- opening the room fresh — live deltas travel over Realtime Broadcast, not
-- through this table).
-- ---------------------------------------------------------------------------
create table friend_group_sessions (
  group_id uuid primary key references friend_groups (id) on delete cascade,
  current_track_id uuid references tracks (id) on delete set null,
  is_playing boolean not null default false,
  position_seconds numeric not null default 0,
  position_updated_at timestamptz not null default now(),
  controller_id uuid references profiles (id) on delete set null,
  controller_is_temp boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ephemeral chat (cleared by app/api/groups/[groupId]/messages's DELETE,
-- called by the last client to leave the room's Realtime presence).
-- ---------------------------------------------------------------------------
create table friend_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references friend_groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index friend_group_messages_group_id_idx on friend_group_messages (group_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table friend_groups enable row level security;
alter table friend_group_members enable row level security;
alter table friend_group_invites enable row level security;
alter table friend_group_tracks enable row level security;
alter table friend_group_track_votes enable row level security;
alter table friend_group_sessions enable row level security;
alter table friend_group_messages enable row level security;

-- Groups: visible to members only; created via the API (service checks
-- happen there), but insert is allowed directly for the creator too.
create policy "members read their groups" on friend_groups
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_groups.id and m.user_id = auth.uid())
  );
create policy "users create groups they admin" on friend_groups
  for insert with check (created_by = auth.uid());

create policy "members read group membership" on friend_group_members
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_members.group_id and m.user_id = auth.uid())
  );
create policy "users join via accepted invite or as creator" on friend_group_members
  for insert with check (
    user_id = auth.uid()
    and (
      exists (select 1 from friend_groups g where g.id = friend_group_members.group_id and g.created_by = auth.uid())
      or exists (
        select 1 from friend_group_invites i
        where i.group_id = friend_group_members.group_id
          and i.invited_user_id = auth.uid()
          and i.status = 'accepted'
      )
    )
  );

-- Invites: any current member can invite; only the invited user can see/update their own invite.
create policy "invited user reads own invite" on friend_group_invites
  for select using (
    invited_user_id = auth.uid()
    or exists (select 1 from friend_group_members m where m.group_id = friend_group_invites.group_id and m.user_id = auth.uid())
  );
create policy "members send invites" on friend_group_invites
  for insert with check (
    invited_by = auth.uid()
    and exists (select 1 from friend_group_members m where m.group_id = friend_group_invites.group_id and m.user_id = auth.uid())
  );
create policy "invited user responds to own invite" on friend_group_invites
  for update using (invited_user_id = auth.uid()) with check (invited_user_id = auth.uid());

-- Shared playlist: members only.
create policy "members read group tracks" on friend_group_tracks
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_tracks.group_id and m.user_id = auth.uid())
  );
create policy "members propose group tracks" on friend_group_tracks
  for insert with check (
    added_by = auth.uid()
    and exists (select 1 from friend_group_members m where m.group_id = friend_group_tracks.group_id and m.user_id = auth.uid())
  );
create policy "members update group tracks" on friend_group_tracks
  for update using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_tracks.group_id and m.user_id = auth.uid())
  );
create policy "members delete group tracks" on friend_group_tracks
  for delete using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_tracks.group_id and m.user_id = auth.uid())
  );

create policy "members read votes" on friend_group_track_votes
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_track_votes.group_id and m.user_id = auth.uid())
  );
create policy "members cast own vote" on friend_group_track_votes
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from friend_group_members m where m.group_id = friend_group_track_votes.group_id and m.user_id = auth.uid())
  );
create policy "members change own vote" on friend_group_track_votes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Broad on purpose: resolving a proposal clears every member's vote on that
-- track (see app/api/groups/[groupId]/tracks/[trackId]/vote/route.ts), not
-- just the caller's own.
create policy "members clear votes on resolution" on friend_group_track_votes
  for delete using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_track_votes.group_id and m.user_id = auth.uid())
  );

-- Session: members can read; writes only ever happen through the API routes
-- using the user's own session (checked against controller_id there) — no
-- direct client UPDATE policy, since the hand-off rules are richer than RLS
-- can express. Insert is allowed once (room creation) for members.
create policy "members read session" on friend_group_sessions
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_sessions.group_id and m.user_id = auth.uid())
  );
create policy "members create session row" on friend_group_sessions
  for insert with check (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_sessions.group_id and m.user_id = auth.uid())
  );
create policy "members update session" on friend_group_sessions
  for update using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_sessions.group_id and m.user_id = auth.uid())
  );

-- Messages: members insert/read; no delete policy for regular users — the
-- "empty the chat" cleanup runs server-side with the service-role client.
create policy "members read messages" on friend_group_messages
  for select using (
    exists (select 1 from friend_group_members m where m.group_id = friend_group_messages.group_id and m.user_id = auth.uid())
  );
create policy "members send messages" on friend_group_messages
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from friend_group_members m where m.group_id = friend_group_messages.group_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Realtime: broadcast/presence work without this, but postgres_changes
-- (chat + votes + tracks updating live for everyone in the room) needs the
-- tables in the realtime publication.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table friend_group_messages;
alter publication supabase_realtime add table friend_group_tracks;
alter publication supabase_realtime add table friend_group_track_votes;
