-- current_quest_period was missing `set search_path`, flagged by the
-- Supabase linter as a mutable-search-path function.
create or replace function current_quest_period(p_scope quest_scope)
returns text
language sql
stable
set search_path = public
as $$
  select case when p_scope = 'hebdomadaire' then to_char(now(), 'IYYY-"W"IW') else 'lifetime' end;
$$;
