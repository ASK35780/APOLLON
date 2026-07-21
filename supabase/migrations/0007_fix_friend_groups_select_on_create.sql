-- POST /api/groups inserts the friend_groups row, then immediately does
-- `.select().single()` to return it, before the creator's
-- friend_group_members row exists (that's the next statement). The old
-- "members read their groups" policy only allowed reads via membership, so
-- that RETURNING-equivalent select failed RLS with "new row violates
-- row-level security policy for table friend_groups" — even though the
-- INSERT itself was allowed.
--
-- Fix: let the creator always read a group they created, independent of
-- membership rows existing yet.
drop policy "members read their groups" on friend_groups;
create policy "members read their groups" on friend_groups
  for select using (
    created_by = auth.uid()
    or exists (select 1 from friend_group_members m where m.group_id = friend_groups.id and m.user_id = auth.uid())
  );
