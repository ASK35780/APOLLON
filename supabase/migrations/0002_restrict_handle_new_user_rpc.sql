-- The Supabase security linter flags SECURITY DEFINER functions that are
-- callable via PostgREST (/rest/v1/rpc/<fn>). handle_new_user() is only
-- meant to run as the on_auth_user_created trigger, not to be invoked
-- directly by anon/authenticated clients.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
