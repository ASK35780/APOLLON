-- "Devenir artiste": links a real artist profile to a user account, logs
-- applications, and adds lightweight play tracking so the artist dashboard
-- (lectures/likes/auditeurs) has real numbers to show instead of zeros forever.

alter table artists
  add column owner_id uuid references profiles (id) on delete set null,
  add column bio text,
  add column banner_url text,
  add column genres text[] not null default '{}';

-- One artist profile per user (existing seeded artists keep owner_id null,
-- and a partial unique index allows any number of nulls).
create unique index artists_owner_id_key on artists (owner_id) where owner_id is not null;

create type artist_application_status as enum ('pending', 'approved', 'rejected');

create table artist_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  artist_id uuid references artists (id) on delete set null,
  artist_name text not null,
  genres text[] not null default '{}',
  bio text,
  motivation text,
  status artist_application_status not null default 'approved',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index artist_applications_user_id_idx on artist_applications (user_id);

create table track_plays (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index track_plays_track_id_idx on track_plays (track_id);

alter table artist_applications enable row level security;
alter table track_plays enable row level security;

-- Artists: readable by everyone already (see 0001_init.sql); users can now
-- also create/update their own artist profile (owner_id = auth.uid()).
create policy "users create their own artist profile" on artists
  for insert with check (owner_id = auth.uid());
create policy "owners update their own artist profile" on artists
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users manage their own applications" on artist_applications
  for select using (user_id = auth.uid());
create policy "users submit their own applications" on artist_applications
  for insert with check (user_id = auth.uid());

-- Plays are logged for both guests (user_id null) and signed-in users, but
-- only readable by the owner of the artist whose track was played.
create policy "anyone logs a play" on track_plays
  for insert with check (user_id is null or user_id = auth.uid());
create policy "artist owners view their track plays" on track_plays
  for select using (
    exists (
      select 1 from tracks t join artists a on a.id = t.artist_id
      where t.id = track_plays.track_id and a.owner_id = auth.uid()
    )
  );
