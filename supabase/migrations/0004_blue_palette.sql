-- Retheme generative cover art to a blue-dominant palette (several distinct
-- shades of blue) instead of the original orange/teal/purple mix. Matches
-- rows by their natural key (name/title/slug) since this runs against data
-- that may already exist from supabase/seed.sql.

update artists set cover_c1 = '#14213D', cover_c2 = '#2E9BD6' where name = 'Nour Kali';
update artists set cover_c1 = '#56CCF2', cover_c2 = '#2E9BD6' where name = 'Yuna Vesper';
update artists set cover_c1 = '#3D5AFE', cover_c2 = '#6C8EEF' where name = 'Ombre Fine';
update artists set cover_c1 = '#4A6FA5', cover_c2 = '#14213D' where name = 'Kaïros';
update artists set cover_c1 = '#2E9BD6', cover_c2 = '#3D5AFE' where name = 'Anaïs Dune';

update tracks set cover_c1 = '#14213D', cover_c2 = '#2E9BD6' where title = 'Marée Basse';
update tracks set cover_c1 = '#56CCF2', cover_c2 = '#2E9BD6' where title = 'Nuits Blanches';
update tracks set cover_c1 = '#3D5AFE', cover_c2 = '#6C8EEF' where title = 'Vertige';
update tracks set cover_c1 = '#4A6FA5', cover_c2 = '#14213D' where title = 'Combustion';
update tracks set cover_c1 = '#2E9BD6', cover_c2 = '#3D5AFE' where title = 'Sel & Cendre';
update tracks set cover_c1 = '#8FD3F4', cover_c2 = '#3D5AFE' where title = 'Verre Fumé';
update tracks set cover_c1 = '#2FB8C6', cover_c2 = '#14213D' where title = 'Lente Dérive';
update tracks set cover_c1 = '#2E9BD6', cover_c2 = '#5B6EE1' where title = 'Insomnie';

update live_shows set cover_c1 = '#14213D', cover_c2 = '#2E9BD6' where title = 'Session acoustique surprise';
update live_shows set cover_c1 = '#4A6FA5', cover_c2 = '#14213D' where title = 'Release party — Combustion';
update live_shows set cover_c1 = '#3D5AFE', cover_c2 = '#6C8EEF' where title = 'Vertige — tournée, date unique';
update live_shows set cover_c1 = '#2E9BD6', cover_c2 = '#3D5AFE' where title = 'Concert de clôture de tournée';
update live_shows set cover_c1 = '#56CCF2', cover_c2 = '#2E9BD6' where title = 'Live intimiste, format piano-voix';

update badges set icon_c1 = '#14213D', icon_c2 = '#2E9BD6' where slug = 'premier-live';
update badges set icon_c1 = '#3D5AFE', icon_c2 = '#6C8EEF' where slug = 'grand-melomane';
update badges set icon_c1 = '#2E9BD6', icon_c2 = '#56CCF2' where slug = 'noctambule';
update badges set icon_c1 = '#4A6FA5', icon_c2 = '#14213D' where slug = 'explorateur';
update badges set icon_c1 = '#2FB8C6', icon_c2 = '#2E9BD6' where slug = 'fidele';
update badges set icon_c1 = '#8FD3F4', icon_c2 = '#3D5AFE' where slug = 'createur';

-- Update defaults too, so future rows inserted without explicit colors land
-- in the blue family rather than the old orange.
alter table artists alter column cover_c1 set default '#14213D';
alter table artists alter column cover_c2 set default '#2E9BD6';
alter table tracks alter column cover_c1 set default '#14213D';
alter table tracks alter column cover_c2 set default '#2E9BD6';
alter table live_shows alter column cover_c1 set default '#14213D';
alter table live_shows alter column cover_c2 set default '#2E9BD6';
alter table badges alter column icon_c1 set default '#14213D';
alter table badges alter column icon_c2 set default '#2E9BD6';
