-- Adds a bio to profiles, and a manually-curated "featured tracks" showcase
-- (distinct from likes — a user picks a small, ordered set of tracks to
-- display on their profile, independent of what they've liked).

alter table profiles add column bio text;
alter table profiles add constraint profiles_bio_length check (char_length(bio) <= 240);

-- The original "users update own profile" policy (0001_init.sql) had no
-- with check clause, so an update satisfying `auth.uid() = id` on the
-- existing row was never re-validated against the *new* row values.
-- Harmless in practice since our API routes control what fields are
-- writable, but tightening it while touching profile updates directly.
alter policy "users update own profile" on profiles
  with check (auth.uid() = id);

create table profile_featured_tracks (
  user_id uuid not null references profiles (id) on delete cascade,
  track_id uuid not null references tracks (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table profile_featured_tracks enable row level security;

create policy "featured tracks are publicly readable"
  on profile_featured_tracks for select using (true);

create policy "users add own featured tracks"
  on profile_featured_tracks for insert with check (user_id = auth.uid());

create policy "users delete own featured tracks"
  on profile_featured_tracks for delete using (user_id = auth.uid());
