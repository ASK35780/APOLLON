-- Direct friend requests (distinct from friend-group invites): a user
-- searches another user by username and sends a request, which the
-- addressee then accepts or declines.
create type friend_request_status as enum ('pending', 'accepted', 'declined');

create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index friend_requests_addressee_idx on friend_requests (addressee_id);
create index friend_requests_requester_idx on friend_requests (requester_id);

alter table friend_requests enable row level security;

create policy "users view their own friend requests" on friend_requests
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "users send friend requests" on friend_requests
  for insert with check (requester_id = auth.uid());

create policy "addressee responds to friend requests" on friend_requests
  for update using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
