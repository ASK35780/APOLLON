-- Apollon rebrand: swap the blue-family column defaults for the new
-- nuit/ambre palette (existing rows were already backfilled directly via
-- execute_sql; this only affects rows created from now on).
alter table artists alter column cover_c1 set default 'oklch(0.14 0.012 280)';
alter table artists alter column cover_c2 set default 'oklch(0.78 0.16 75)';

alter table tracks alter column cover_c1 set default 'oklch(0.14 0.012 280)';
alter table tracks alter column cover_c2 set default 'oklch(0.78 0.16 75)';

alter table playlists alter column cover_c1 set default 'oklch(0.78 0.16 75)';
alter table playlists alter column cover_c2 set default 'oklch(0.65 0.15 75)';

alter table live_shows alter column cover_c1 set default 'oklch(0.14 0.012 280)';
alter table live_shows alter column cover_c2 set default 'oklch(0.78 0.16 75)';
