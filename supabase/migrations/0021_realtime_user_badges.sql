-- Lets the main app subscribe to a user's own badge changes in realtime, so
-- a badge granted/revoked from the separate Gestion Apollon admin site
-- shows up on the profile instantly instead of needing a reload. RLS
-- already allows public select on user_badges (0001_init.sql), so this is
-- just exposing that same readable data over the realtime channel too.
alter publication supabase_realtime add table user_badges;
