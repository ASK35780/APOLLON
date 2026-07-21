-- Content moderation: artist applications, track uploads, and subtitle
-- submissions all stay hidden until the single admin account approves them
-- (checked server-side against a hardcoded email — see lib/admin.ts).
-- Admin actions that touch content require a mandatory reason, logged in
-- admin_actions for an audit trail.

alter type artist_application_status rename to moderation_status;

-- Backfill existing (seeded) rows to 'approved' via the ADD COLUMN default,
-- then flip the default so new artist/track rows start out pending.
alter table artists add column status moderation_status not null default 'approved';
alter table artists alter column status set default 'pending';

alter table tracks add column status moderation_status not null default 'approved';
alter table tracks alter column status set default 'pending';
alter table tracks add column media_type text not null default 'audio' check (media_type in ('audio', 'video'));

alter table artist_applications alter column status set default 'pending';

-- Tighten public read access: only approved rows, or the owner's own
-- (still-pending/rejected) rows.
drop policy "artists are publicly readable" on artists;
create policy "approved artists are publicly readable" on artists
  for select using (status = 'approved' or owner_id = auth.uid());

drop policy "tracks are publicly readable" on tracks;
create policy "approved tracks are publicly readable" on tracks
  for select using (
    status = 'approved'
    or exists (select 1 from artists a where a.id = tracks.artist_id and a.owner_id = auth.uid())
  );

-- Artists manage their own tracks (upload/edit/retract before or after review).
create policy "artist owners upload their own tracks" on tracks
  for insert with check (
    exists (select 1 from artists a where a.id = tracks.artist_id and a.owner_id = auth.uid())
  );
create policy "artist owners update their own tracks" on tracks
  for update using (
    exists (select 1 from artists a where a.id = tracks.artist_id and a.owner_id = auth.uid())
  ) with check (
    exists (select 1 from artists a where a.id = tracks.artist_id and a.owner_id = auth.uid())
  );
create policy "artist owners delete their own tracks" on tracks
  for delete using (
    exists (select 1 from artists a where a.id = tracks.artist_id and a.owner_id = auth.uid())
  );

-- Subtitle proposals from any signed-in user, moderated before being merged
-- into the publicly-readable lyric_lines table.
create table subtitle_submissions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks (id) on delete cascade,
  submitted_by uuid not null references profiles (id) on delete cascade,
  lines jsonb not null,
  status moderation_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index subtitle_submissions_track_id_idx on subtitle_submissions (track_id);

alter table subtitle_submissions enable row level security;

create policy "users submit subtitles for any track" on subtitle_submissions
  for insert with check (submitted_by = auth.uid());
create policy "users view their own subtitle submissions" on subtitle_submissions
  for select using (submitted_by = auth.uid());

-- Admin audit log. No RLS policies on purpose: only the service-role client
-- (from app/api/admin/** routes, after verifying the admin email) touches
-- this table, so RLS with zero policies denies every anon/authenticated
-- request outright.
create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles (id) on delete cascade,
  action text not null,
  target_user_id uuid references profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  reason text not null,
  created_at timestamptz not null default now()
);
create index admin_actions_admin_id_idx on admin_actions (admin_id);

alter table admin_actions enable row level security;

-- Artists upload their own track files into the same public bucket used for
-- the imported catalog (see 0009_track_audio_bucket.sql), scoped to their
-- own folder like the avatars bucket. 100MB cap covers a full song or a
-- short mp4 clip without opening the door to arbitrary large uploads.
update storage.buckets set file_size_limit = 104857600 where id = 'track-audio';

create policy "artists upload their own track files"
  on storage.objects for insert
  with check (bucket_id = 'track-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "artists manage their own track files"
  on storage.objects for update
  using (bucket_id = 'track-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "artists delete their own track files"
  on storage.objects for delete
  using (bucket_id = 'track-audio' and (storage.foldername(name))[1] = auth.uid()::text);
