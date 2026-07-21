-- The playlists table's cover_c2 default (#34C8A6, teal) predates the
-- blue-only palette applied in 0004_blue_palette.sql to every other cover
-- (artists/tracks/live_shows/badges) — 0004 didn't touch playlists since no
-- playlist-creation feature existed yet. Now that users can create
-- playlists, bring the default in line with the rest of the app.
alter table playlists alter column cover_c2 set default '#56CCF2';
