-- Public artist profiles need to show aggregate play stats (monthly
-- listeners, total plays) to any visitor, not just the artist owner or the
-- listener themselves — mirrors how streaming platforms show these numbers
-- publicly. Scoped to approved tracks only, matching the moderation gate
-- everywhere else in the catalog.
create policy "anyone views plays on approved tracks" on track_plays for select using (
  exists (select 1 from tracks t where t.id = track_plays.track_id and t.status = 'approved')
);
