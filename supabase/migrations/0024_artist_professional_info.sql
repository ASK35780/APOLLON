-- Professional-level info for artist profiles: location, label, career start
-- year, website and social links. All optional/nullable — filled in by the
-- artist owner from their own dashboard (see /api/artist/profile).
alter table artists
  add column location text,
  add column label text,
  add column founded_year smallint check (founded_year is null or founded_year between 1900 and 2100),
  add column website text,
  add column instagram_url text,
  add column tiktok_url text,
  add column youtube_url text,
  add column spotify_url text;
