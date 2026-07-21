-- track_plays previously only had a SELECT policy for the owning artist
-- (artist-facing play-count stats). The listener-facing "recently played"
-- feature needs users to be able to read their own play history too.
create policy "users view their own track plays" on track_plays for select using (user_id = auth.uid());
