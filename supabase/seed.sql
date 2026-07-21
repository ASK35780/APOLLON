-- Seed data ported from the original static mockup, for local dev only.
-- Run with `supabase db reset` (applies migrations then this file).
-- Color palette: several blue shades, no other hues (see 0004_blue_palette.sql
-- for the equivalent update against already-seeded projects).

with artist_rows as (
  insert into artists (name, cover_c1, cover_c2, cover_pattern) values
    ('Nour Kali',   '#14213D', '#2E9BD6', 'a'),
    ('Yuna Vesper', '#56CCF2', '#2E9BD6', 'b'),
    ('Ombre Fine',  '#3D5AFE', '#6C8EEF', 'c'),
    ('Kaïros',      '#4A6FA5', '#14213D', 'd'),
    ('Anaïs Dune',  '#2E9BD6', '#3D5AFE', 'e')
  returning id, name
)
select * from artist_rows;

-- Tracks (durations in seconds, matching the mockup's `dur` fields)
insert into tracks (title, artist_id, duration_seconds, audio_url, cover_c1, cover_c2, cover_pattern)
select v.title, a.id, v.duration_seconds, v.audio_url, v.c1, v.c2, v.pattern::cover_pattern
from (values
  ('Marée Basse',  'Nour Kali',    213, 'https://example-cdn.test/audio/maree-basse.mp3',  '#14213D', '#2E9BD6', 'a'),
  ('Nuits Blanches','Yuna Vesper', 187, 'https://example-cdn.test/audio/nuits-blanches.mp3','#56CCF2', '#2E9BD6', 'b'),
  ('Vertige',       'Ombre Fine',  241, 'https://example-cdn.test/audio/vertige.mp3',       '#3D5AFE', '#6C8EEF', 'c'),
  ('Combustion',    'Kaïros',      198, 'https://example-cdn.test/audio/combustion.mp3',    '#4A6FA5', '#14213D', 'd'),
  ('Sel & Cendre',  'Anaïs Dune',  225, 'https://example-cdn.test/audio/sel-et-cendre.mp3', '#2E9BD6', '#3D5AFE', 'e'),
  ('Verre Fumé',    'Nour Kali',   176, 'https://example-cdn.test/audio/verre-fume.mp3',    '#8FD3F4', '#3D5AFE', 'b'),
  ('Lente Dérive',  'Ombre Fine',  254, 'https://example-cdn.test/audio/lente-derive.mp3',  '#2FB8C6', '#14213D', 'c'),
  ('Insomnie',      'Yuna Vesper', 203, 'https://example-cdn.test/audio/insomnie.mp3',      '#2E9BD6', '#5B6EE1', 'a')
) as v(title, artist_name, duration_seconds, audio_url, c1, c2, pattern)
join artists a on a.name = v.artist_name;

-- Lyric lines for "Marée Basse" as a worked example; add the rest per track.
insert into lyric_lines (track_id, timestamp_seconds, text)
select t.id, v.ts, v.line
from tracks t, (values
  (0,   'La ville se tait sous la pluie fine'),
  (20,  'Nos ombres glissent sur l''asphalte'),
  (48,  'Marée basse, le sel sur ta peau'),
  (80,  'On reste là, sans un mot'),
  (115, 'Le vent tourne, les lumières s''éteignent'),
  (150, 'Marée basse, encore une fois'),
  (185, 'Le jour se lève sur nos silences')
) as v(ts, line)
where t.title = 'Marée Basse';

-- Live shows
insert into live_shows (artist_id, title, description, status, scheduled_at, price_cents, cover_c1, cover_c2, cover_pattern, viewer_count)
select a.id, v.title, v.description, v.status::live_show_status, v.scheduled_at, v.price_cents, v.c1, v.c2, v.pattern::cover_pattern, v.viewer_count
from (values
  ('Nour Kali',   'Session acoustique surprise',        'Set solo voix et guitare, en direct de son appartement à Lisbonne.', 'live',     now(),                 1500, '#14213D', '#2E9BD6', 'a', 12400),
  ('Kaïros',      'Release party — Combustion',          'Diffusion en direct du concert de sortie d''album, salle comble à Bruxelles.', 'live', now(),          1500, '#4A6FA5', '#14213D', 'd', 8100),
  ('Ombre Fine',  'Vertige — tournée, date unique',      'Dernière date de la tournée, captée en direct depuis Marseille.', 'live',     now(),                 1500, '#3D5AFE', '#6C8EEF', 'c', 5700),
  ('Anaïs Dune',  'Concert de clôture de tournée',       'Concert événement pour la dernière date de la tournée « Sel & Cendre ».', 'upcoming', now() + interval '1 day', 1500, '#2E9BD6', '#3D5AFE', 'e', 0),
  ('Yuna Vesper', 'Live intimiste, format piano-voix',   'Une heure de reprises et titres inédits, en petit comité.', 'upcoming', now() + interval '4 days', 1500, '#56CCF2', '#2E9BD6', 'b', 0)
) as v(artist_name, title, description, status, scheduled_at, price_cents, c1, c2, pattern, viewer_count)
join artists a on a.name = v.artist_name;

-- Badges
insert into badges (slug, name, description, icon_c1, icon_c2) values
  ('premier-live',    'Premier live',    'Assister à son premier concert en direct', 'oklch(0.14 0.012 280)', 'oklch(0.78 0.16 75)'),
  ('grand-melomane',  'Grand mélomane',  'Liker 50 titres',                          'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)'),
  ('noctambule',      'Noctambule',      'Écouter après minuit, 10 fois',            'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)'),
  ('explorateur',     'Explorateur',     'Découvrir 5 ambiances différentes',        'oklch(0.5 0.06 60)', 'oklch(0.14 0.012 280)'),
  ('fidele',          'Fidèle',          'Utiliser Apollon pendant 30 jours',        'oklch(0.7 0.13 90)', 'oklch(0.78 0.16 75)'),
  ('createur',        'Créateur',        'Créer sa première playlist',               'oklch(0.85 0.1 85)', 'oklch(0.6 0.14 55)'),
  ('staff',            'Staff',            'Membre de l''équipe Apollon',              'oklch(0.14 0.012 280)', 'oklch(0.78 0.16 75)'),
  ('partenaire',       'Partenaire',       'Partenaire officiel d''Apollon',           'oklch(0.5 0.06 60)', 'oklch(0.7 0.13 90)'),
  ('artiste-certifie', 'Artiste certifié', 'Profil artiste vérifié par l''équipe',     'oklch(0.65 0.15 75)', 'oklch(0.85 0.1 85)');

-- Quests
insert into quests (slug, title, description, category, scope, metric, target_count, reward_xp, reward_badge_id, icon_c1, icon_c2, sort_order) values
  ('ecoute-active-hebdo', 'Écoute active', 'Écoute 15 titres cette semaine.', 'ecoute', 'hebdomadaire', 'tracks_played', 15, 30, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 1),
  ('coeur-ouvert-hebdo', 'Cœur ouvert', 'Like 5 titres cette semaine.', 'ecoute', 'hebdomadaire', 'tracks_liked', 5, 20, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 2),
  ('decouverte-hebdo', 'Découverte de la semaine', 'Découvre 3 nouveaux artistes cette semaine.', 'decouverte', 'hebdomadaire', 'artists_discovered', 3, 25, null, 'oklch(0.7 0.13 90)', 'oklch(0.85 0.1 85)', 3),
  ('toujours-connecte-hebdo', 'Toujours connecté', 'Envoie 3 messages à tes amis cette semaine.', 'social', 'hebdomadaire', 'messages_sent', 3, 15, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 4),
  ('premiers-pas', 'Premiers pas', 'Écoute 5 titres.', 'ecoute', 'permanente', 'tracks_played', 5, 20, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 1),
  ('papillon-social', 'Papillon social', 'Ajoute 3 amis.', 'social', 'permanente', 'friends_added', 3, 70, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 2),
  ('esprit-de-groupe', 'Esprit de groupe', 'Rejoins un groupe d''amis.', 'social', 'permanente', 'groups_joined', 1, 50, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 3),
  ('voix-de-lombre', 'Voix de l''ombre', 'Propose des sous-titres pour un titre.', 'creation', 'permanente', 'subtitles_submitted', 1, 50, null, 'oklch(0.65 0.15 75)', 'oklch(0.72 0.14 65)', 4),
  ('artiste-en-herbe', 'Artiste en herbe', 'Deviens artiste sur Apollon.', 'creation', 'permanente', 'became_artist', 1, 150, null, 'oklch(0.65 0.15 75)', 'oklch(0.72 0.14 65)', 5),
  ('premier-concert', 'Premier live', 'Assiste à ton premier concert en direct.', 'social', 'permanente', 'live_attended', 1, 100,
    (select id from badges where slug = 'premier-live'), 'oklch(0.14 0.012 280)', 'oklch(0.78 0.16 75)', 6),
  ('melomane-permanent', 'Grand mélomane', 'Like 50 titres.', 'ecoute', 'permanente', 'tracks_liked', 50, 150,
    (select id from badges where slug = 'grand-melomane'), 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 7),
  ('noctambule-quest', 'Noctambule', 'Écoute de la musique après minuit, 10 fois.', 'ecoute', 'permanente', 'night_listens', 10, 120,
    (select id from badges where slug = 'noctambule'), 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 8),
  ('explorateur-quest', 'Explorateur', 'Découvre des titres de 5 artistes différents.', 'decouverte', 'permanente', 'artists_discovered', 5, 80,
    (select id from badges where slug = 'explorateur'), 'oklch(0.5 0.06 60)', 'oklch(0.14 0.012 280)', 9),
  ('fidele-quest', 'Fidèle', 'Utilise Apollon pendant 30 jours.', 'social', 'permanente', 'account_age_days', 30, 200,
    (select id from badges where slug = 'fidele'), 'oklch(0.7 0.13 90)', 'oklch(0.78 0.16 75)', 10),
  ('createur-quest', 'Créateur', 'Crée ta première playlist.', 'creation', 'permanente', 'playlists_created', 1, 60,
    (select id from badges where slug = 'createur'), 'oklch(0.85 0.1 85)', 'oklch(0.6 0.14 55)', 11)
on conflict (slug) do nothing;
