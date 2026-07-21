-- Reverb: core schema
-- Run via `supabase db push` or the Supabase SQL editor.

create extension if not exists "pgcrypto";

create type cover_pattern as enum ('a', 'b', 'c', 'd', 'e');
create type live_show_status as enum ('upcoming', 'live', 'ended');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Artists / tracks / lyrics
-- ---------------------------------------------------------------------------
create table artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  cover_c1 text not null default '#FF6B4A',
  cover_c2 text not null default '#E8B84B',
  cover_pattern cover_pattern not null default 'a',
  created_at timestamptz not null default now()
);

create table tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid not null references artists (id) on delete cascade,
  duration_seconds integer not null check (duration_seconds > 0),
  audio_url text not null,
  cover_c1 text not null default '#FF6B4A',
  cover_c2 text not null default '#E8B84B',
  cover_pattern cover_pattern not null default 'a',
  created_at timestamptz not null default now()
);
create index tracks_artist_id_idx on tracks (artist_id);

create table lyric_lines (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks (id) on delete cascade,
  timestamp_seconds integer not null check (timestamp_seconds >= 0),
  text text not null
);
create index lyric_lines_track_id_idx on lyric_lines (track_id, timestamp_seconds);

-- ---------------------------------------------------------------------------
-- Playlists
-- ---------------------------------------------------------------------------
create table playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  description text,
  cover_c1 text not null default '#2E9BD6',
  cover_c2 text not null default '#34C8A6',
  cover_pattern cover_pattern not null default 'c',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index playlists_owner_id_idx on playlists (owner_id);

create table playlist_tracks (
  playlist_id uuid not null references playlists (id) on delete cascade,
  track_id uuid not null references tracks (id) on delete cascade,
  position integer not null,
  primary key (playlist_id, track_id)
);

-- ---------------------------------------------------------------------------
-- Likes
-- ---------------------------------------------------------------------------
create table likes (
  user_id uuid not null references profiles (id) on delete cascade,
  track_id uuid not null references tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- ---------------------------------------------------------------------------
-- Live shows + paywall purchases (Stripe)
-- ---------------------------------------------------------------------------
create table live_shows (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists (id) on delete cascade,
  title text not null,
  description text,
  status live_show_status not null default 'upcoming',
  scheduled_at timestamptz not null,
  price_cents integer not null check (price_cents >= 0),
  stripe_price_id text,
  stream_url text,
  cover_c1 text not null default '#FF6B4A',
  cover_c2 text not null default '#E8B84B',
  cover_pattern cover_pattern not null default 'a',
  viewer_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index live_shows_status_idx on live_shows (status, scheduled_at);

create table live_show_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  live_show_id uuid not null references live_shows (id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, live_show_id)
);

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
create table badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon_c1 text not null default '#FF3B4E',
  icon_c2 text not null default '#FF6B4A',
  created_at timestamptz not null default now()
);

create table user_badges (
  user_id uuid not null references profiles (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table artists enable row level security;
alter table tracks enable row level security;
alter table lyric_lines enable row level security;
alter table playlists enable row level security;
alter table playlist_tracks enable row level security;
alter table likes enable row level security;
alter table live_shows enable row level security;
alter table live_show_purchases enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Public read on catalog-style tables
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "artists are publicly readable" on artists for select using (true);
create policy "tracks are publicly readable" on tracks for select using (true);
create policy "lyrics are publicly readable" on lyric_lines for select using (true);
create policy "badges are publicly readable" on badges for select using (true);
create policy "live shows are publicly readable" on live_shows for select using (true);

-- Profiles: users manage their own row
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Playlists: public ones visible to everyone, private ones to their owner
create policy "playlists visible if public or owned" on playlists
  for select using (is_public or owner_id = auth.uid());
create policy "users manage own playlists" on playlists
  for insert with check (owner_id = auth.uid());
create policy "users update own playlists" on playlists
  for update using (owner_id = auth.uid());
create policy "users delete own playlists" on playlists
  for delete using (owner_id = auth.uid());

create policy "playlist tracks follow playlist visibility" on playlist_tracks
  for select using (
    exists (
      select 1 from playlists p
      where p.id = playlist_tracks.playlist_id
        and (p.is_public or p.owner_id = auth.uid())
    )
  );
create policy "owners manage playlist tracks" on playlist_tracks
  for all using (
    exists (select 1 from playlists p where p.id = playlist_tracks.playlist_id and p.owner_id = auth.uid())
  );

-- Likes: users only see/manage their own likes
create policy "users read own likes" on likes for select using (user_id = auth.uid());
create policy "users insert own likes" on likes for insert with check (user_id = auth.uid());
create policy "users delete own likes" on likes for delete using (user_id = auth.uid());

-- Live show purchases: users only see their own purchase receipts.
-- Rows are written exclusively by the Stripe webhook via the service-role
-- client, so there is no insert/update policy for regular users here.
create policy "users read own purchases" on live_show_purchases
  for select using (user_id = auth.uid());

-- User badges: publicly readable (shown on profiles), earned server-side only
create policy "user badges are publicly readable" on user_badges for select using (true);
