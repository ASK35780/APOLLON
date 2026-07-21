-- Quest catalog: 4 weekly quests + 11 permanent quests, 6 of which finally
-- give the original achievement badges a real unlock path.
insert into quests (slug, title, description, category, scope, metric, target_count, reward_xp, reward_badge_id, icon_c1, icon_c2, sort_order) values
  -- Weekly
  ('ecoute-active-hebdo', 'Écoute active', 'Écoute 15 titres cette semaine.', 'ecoute', 'hebdomadaire', 'tracks_played', 15, 30, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 1),
  ('coeur-ouvert-hebdo', 'Cœur ouvert', 'Like 5 titres cette semaine.', 'ecoute', 'hebdomadaire', 'tracks_liked', 5, 20, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 2),
  ('decouverte-hebdo', 'Découverte de la semaine', 'Découvre 3 nouveaux artistes cette semaine.', 'decouverte', 'hebdomadaire', 'artists_discovered', 3, 25, null, 'oklch(0.7 0.13 90)', 'oklch(0.85 0.1 85)', 3),
  ('toujours-connecte-hebdo', 'Toujours connecté', 'Envoie 3 messages à tes amis cette semaine.', 'social', 'hebdomadaire', 'messages_sent', 3, 15, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 4),
  -- Permanent — new
  ('premiers-pas', 'Premiers pas', 'Écoute 5 titres.', 'ecoute', 'permanente', 'tracks_played', 5, 20, null, 'oklch(0.78 0.16 75)', 'oklch(0.65 0.15 75)', 1),
  ('papillon-social', 'Papillon social', 'Ajoute 3 amis.', 'social', 'permanente', 'friends_added', 3, 70, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 2),
  ('esprit-de-groupe', 'Esprit de groupe', 'Rejoins un groupe d''amis.', 'social', 'permanente', 'groups_joined', 1, 50, null, 'oklch(0.6 0.14 55)', 'oklch(0.7 0.13 90)', 3),
  ('voix-de-lombre', 'Voix de l''ombre', 'Propose des sous-titres pour un titre.', 'creation', 'permanente', 'subtitles_submitted', 1, 50, null, 'oklch(0.65 0.15 75)', 'oklch(0.72 0.14 65)', 4),
  ('artiste-en-herbe', 'Artiste en herbe', 'Deviens artiste sur Apollon.', 'creation', 'permanente', 'became_artist', 1, 150, null, 'oklch(0.65 0.15 75)', 'oklch(0.72 0.14 65)', 5),
  -- Permanent — unlock the original achievement badges
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
