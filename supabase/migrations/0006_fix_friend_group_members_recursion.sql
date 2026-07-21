-- The "members read group membership" policy on friend_group_members
-- queried friend_group_members from inside its own USING clause, which
-- re-triggers that same policy for the subquery — infinite recursion
-- (Postgres error 42P17). Every other table's "is this user a member"
-- policy also queries friend_group_members via EXISTS, so they all hit
-- this same recursive policy indirectly and break too.
--
-- Fix: check membership through a SECURITY DEFINER function instead. It
-- runs with the function owner's privileges, which bypasses RLS on the
-- inner lookup, so there's no self-reference.
create or replace function public.is_friend_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from friend_group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

drop policy "members read group membership" on friend_group_members;
create policy "members read group membership" on friend_group_members
  for select using (public.is_friend_group_member(group_id, auth.uid()));
