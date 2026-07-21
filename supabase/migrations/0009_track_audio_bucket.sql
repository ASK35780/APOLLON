-- Storage bucket for real catalog audio files (imported from Archive.org /
-- Jamendo — see scratchpad/import scripts). Public bucket: playback needs
-- no auth. Only the service-role key writes here (catalog content isn't
-- user-owned), so there's no INSERT policy for anon/authenticated — same
-- reasoning as the storage.objects SELECT-only pattern used for avatars.
insert into storage.buckets (id, name, public)
values ('track-audio', 'track-audio', true)
on conflict (id) do nothing;
