-- Avatar/banner uploads (Supabase Storage) + badge showcase selection.

-- Public bucket: profile photos are meant to be visible to anyone viewing a
-- profile. Writes are restricted to the owner's own folder via the policies
-- below (path convention: "<user_id>/avatar.<ext>", "<user_id>/banner.<ext>").
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- No SELECT policy: the bucket is public, so files are already served via
-- the public object URL without going through RLS. Adding a broad SELECT
-- policy here would only additionally allow listing the bucket's contents.

create policy "Users upload to their own avatar folder"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update their own avatar folder"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete their own avatar folder"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Which of a user's unlocked badges they've chosen to showcase on their
-- profile (see components/EditProfileOverlay.tsx). Earning a badge
-- (inserting user_badges) stays server-side only; this lets the owner flip
-- their own rows' `featured` flag.
alter table user_badges add column featured boolean not null default false;

create policy "users update own featured badges" on user_badges
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
