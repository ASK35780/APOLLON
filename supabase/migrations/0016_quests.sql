-- Quests: gamified objectives computed live from real activity already in
-- the schema (plays, likes, playlists, friends, groups, messages,
-- subtitles, artist candidature, live purchases) — no separate event log
-- needed. Also finally gives the long-dormant achievement badges
-- (premier-live/grand-melomane/noctambule/explorateur/fidele/createur) a
-- real unlock mechanism.

create type quest_category as enum ('ecoute', 'social', 'decouverte', 'creation');
create type quest_scope as enum ('hebdomadaire', 'permanente');
create type quest_metric as enum (
  'tracks_played',
  'tracks_liked',
  'playlists_created',
  'friends_added',
  'artists_discovered',
  'groups_joined',
  'night_listens',
  'messages_sent',
  'subtitles_submitted',
  'became_artist',
  'live_attended',
  'account_age_days'
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  category quest_category not null,
  scope quest_scope not null,
  metric quest_metric not null,
  target_count integer not null check (target_count > 0),
  reward_xp integer not null default 0,
  reward_badge_id uuid references badges (id) on delete set null,
  icon_c1 text not null default 'oklch(0.78 0.16 75)',
  icon_c2 text not null default 'oklch(0.65 0.15 75)',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table user_quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  quest_id uuid not null references quests (id) on delete cascade,
  -- 'lifetime' for permanent quests, an ISO year-week string (e.g.
  -- '2026-W29') for weekly ones — lets a weekly quest be re-claimed every
  -- week without a duplicate-completion conflict.
  period_key text not null default 'lifetime',
  completed_at timestamptz not null default now(),
  unique (user_id, quest_id, period_key)
);
create index user_quest_completions_user_idx on user_quest_completions (user_id);

-- Computes the caller's own progress toward a quest straight from the
-- underlying activity tables. SECURITY DEFINER so it can read tables the
-- caller's RLS wouldn't otherwise let them aggregate across (e.g. counting
-- their own track_plays is fine, but this keeps the counting logic in one
-- trusted place). Always operates on auth.uid() — never takes a user id as
-- input — so it can't be used to probe another user's activity.
create or replace function quest_progress(p_quest_id uuid)
returns integer
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_metric quest_metric;
  v_scope quest_scope;
  v_since timestamptz;
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    return 0;
  end if;

  select metric, scope into v_metric, v_scope from quests where id = p_quest_id;
  if v_metric is null then
    return 0;
  end if;

  if v_scope = 'hebdomadaire' then
    v_since := date_trunc('week', now());
  else
    v_since := 'epoch'::timestamptz;
  end if;

  case v_metric
    when 'tracks_played' then
      select count(*) into v_count from track_plays where user_id = v_uid and created_at >= v_since;
    when 'tracks_liked' then
      select count(*) into v_count from likes where user_id = v_uid and created_at >= v_since;
    when 'playlists_created' then
      select count(*) into v_count from playlists where owner_id = v_uid and created_at >= v_since;
    when 'friends_added' then
      select count(*) into v_count from friend_requests
        where status = 'accepted'
          and (requester_id = v_uid or addressee_id = v_uid)
          and coalesce(responded_at, created_at) >= v_since;
    when 'artists_discovered' then
      select count(distinct t.artist_id) into v_count
        from track_plays tp join tracks t on t.id = tp.track_id
        where tp.user_id = v_uid and tp.created_at >= v_since;
    when 'groups_joined' then
      select count(*) into v_count from friend_group_members where user_id = v_uid and joined_at >= v_since;
    when 'night_listens' then
      select count(*) into v_count from track_plays
        where user_id = v_uid and created_at >= v_since and extract(hour from created_at) between 0 and 4;
    when 'messages_sent' then
      select count(*) into v_count from direct_messages where sender_id = v_uid and created_at >= v_since;
    when 'subtitles_submitted' then
      select count(*) into v_count from subtitle_submissions where submitted_by = v_uid and created_at >= v_since;
    when 'became_artist' then
      select count(*) into v_count from artists where owner_id = v_uid;
    when 'live_attended' then
      select count(*) into v_count from live_show_purchases where user_id = v_uid and purchased_at >= v_since;
    when 'account_age_days' then
      select greatest(0, extract(day from now() - p.created_at))::integer into v_count
        from profiles p where p.id = v_uid;
    else
      v_count := 0;
  end case;

  return coalesce(v_count, 0);
end;
$$;

-- Pure, no auth dependency — just today's period bucket for a given scope.
create or replace function current_quest_period(p_scope quest_scope)
returns text
language sql
stable
as $$
  select case when p_scope = 'hebdomadaire' then to_char(now(), 'IYYY-"W"IW') else 'lifetime' end;
$$;

alter table quests enable row level security;
create policy "quests are publicly readable" on quests for select using (true);

alter table user_quest_completions enable row level security;

create policy "users view their own quest completions" on user_quest_completions
  for select using (user_id = auth.uid());

-- The real gate: only lets a completion row through if quest_progress()
-- (computed server-side from real activity, not client input) already
-- meets the target — a client can't fake a claim by posting arbitrary rows.
create policy "users claim only quests they've actually completed" on user_quest_completions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from quests q
      where q.id = user_quest_completions.quest_id
        and quest_progress(q.id) >= q.target_count
    )
  );
