-- Following an artist (Spotify/Deezer-style) — was entirely missing;
-- ProfileOverlay's "following" stat was a hardcoded placeholder until now.
create table artist_follows (
  user_id uuid not null references profiles (id) on delete cascade,
  artist_id uuid not null references artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);
create index artist_follows_artist_id_idx on artist_follows (artist_id);

alter table artist_follows enable row level security;

create policy "artist follows are publicly readable"
  on artist_follows for select using (true);

create policy "users follow as themselves"
  on artist_follows for insert with check (user_id = auth.uid());

create policy "users unfollow their own follows"
  on artist_follows for delete using (user_id = auth.uid());
