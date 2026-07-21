-- New status badges (Staff / Partenaire / Artiste certifié) alongside the
-- existing achievement badges. Unlike the others these aren't meant to be
-- self-earned — granting them to a specific user_badges row is a manual/
-- admin action, not built here.
insert into badges (slug, name, description, icon_c1, icon_c2) values
  ('staff',            'Staff',            'Membre de l''équipe Apollon',              'oklch(0.14 0.012 280)', 'oklch(0.78 0.16 75)'),
  ('partenaire',       'Partenaire',       'Partenaire officiel d''Apollon',           'oklch(0.5 0.06 60)', 'oklch(0.7 0.13 90)'),
  ('artiste-certifie', 'Artiste certifié', 'Profil artiste vérifié par l''équipe',     'oklch(0.65 0.15 75)', 'oklch(0.85 0.1 85)')
on conflict (slug) do nothing;
