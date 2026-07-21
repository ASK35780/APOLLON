# Apollon

Application de streaming musical (Next.js App Router + TypeScript), avec authentification et
base de données Supabase, paiement Stripe pour les lives payants, déploiement Vercel et CI GitHub Actions.

## Stack

- **Next.js 14 (App Router) + TypeScript** — UI et API routes
- **Supabase** — Postgres, Auth (e-mail/mot de passe + Google/GitHub), Storage (photos de profil),
  Row Level Security, **Realtime** (presence + broadcast + postgres changes pour les playlists entre amis)
- **Stripe** — Checkout + webhook pour débloquer un concert en direct payant
- **Vercel** — hébergement et déploiement continu
- **GitHub Actions** — lint / typecheck / build sur chaque PR, déploiement des migrations Supabase

## Structure

```
app/
  (app)/            # Shell "phone" — accessible en invité, certaines actions demandent un compte
    page.tsx         Accueil
    search/          Recherche
    library/         Bibliothèque
    live/            Point d'entrée pour l'overlay Live
    layout.tsx        Shell de l'app : status bar, app bar, mini player, tab bar,
                       overlays Live/Profil ; récupère les données Supabase, avec
                       des valeurs par défaut vides si l'utilisateur est invité
                       (voir store/session-store.ts, store/likes-store.ts et
                       components/Paywall.tsx pour le renvoi vers /login sur les
                       actions qui exigent un compte : liker, payer un live)
  api/
    likes/                     Like / unlike un titre
    tracks/[trackId]/lyrics/   Paroles d'un titre
    tracks/search/             Recherche de titres
    live/purchase/             Vérifie si un live est débloqué
    stripe/checkout/           Crée une session Stripe Checkout
    stripe/webhook/            Confirme le paiement et débloque le live
    users/search/              Recherche de pseudo (invitations de groupe)
    groups/                    Playlists entre amis : création, invitations, propositions
                               d'ajout/retrait de titres + vote, contrôle de la session
                               d'écoute synchronisée, chat éphémère (voir lib/useGroupRoomChannel.ts
                               et lib/group-votes.ts pour la logique temps réel et de résolution des votes)
  login/             Connexion par lien magique
  auth/callback/     Échange le code Supabase contre une session
  globals.css        Design system (variables, classes) repris de la maquette

components/         Composants React (CoverArt, TrackRow, MiniPlayer, NowPlaying,
                     LiveOverlay, Paywall, ProfileOverlay, TabBar, ...)
store/               État client (zustand) : lecteur, likes, overlays UI
lib/
  supabase/          Clients Supabase (browser / server / admin-service-role)
  queries/           Accès aux données (server-only)
  stripe.ts          Client Stripe
types/database.ts    Types miroir du schéma SQL

supabase/
  migrations/0001_init.sql              Schéma, contraintes, RLS
  migrations/0005_friend_groups.sql     Playlists entre amis (groupes, votes, session, chat)
  seed.sql                              Données de démo (reprises de la maquette)

.github/workflows/   CI (lint/typecheck/build) + déploiement des migrations Supabase
```

## Mise en route

1. **Dépendances**

   ```bash
   npm install
   ```

2. **Supabase**

   - Crée un projet sur [supabase.com](https://supabase.com).
   - Copie `.env.example` vers `.env.local` et renseigne `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Applique le schéma et les données de démo :

     ```bash
     supabase link --project-ref <ref>
     supabase db push
     psql "$(supabase db show-connection-string ...)" -f supabase/seed.sql
     ```

     (ou colle le contenu de `supabase/migrations/0001_init.sql` puis `supabase/seed.sql`
     dans l'éditeur SQL du dashboard Supabase).
   - Active l'authentification par e-mail (lien magique) dans Authentication → Providers,
     et ajoute `http://localhost:3000/auth/callback` (puis ton domaine de prod) dans les
     Redirect URLs.

3. **Stripe**

   - Récupère `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` sur le dashboard Stripe.
   - En local, écoute les webhooks avec la Stripe CLI et colle le secret affiché dans
     `STRIPE_WEBHOOK_SECRET` :

     ```bash
     npm run stripe:listen
     ```

4. **Lancer l'app**

   ```bash
   npm run dev
   ```

## Déploiement

- **Vercel** : importe le repo GitHub, ajoute les variables d'environnement de `.env.example`
  dans Project Settings → Environment Variables, puis déploie. `vercel.json` fixe déjà le
  framework et la région.
- **Stripe webhook en prod** : crée un endpoint `https://<domaine>/api/stripe/webhook` dans le
  dashboard Stripe (événement `checkout.session.completed`) et renseigne son secret dans
  `STRIPE_WEBHOOK_SECRET` sur Vercel.
- **GitHub Actions** : ajoute les mêmes secrets côté GitHub (Settings → Secrets and variables →
  Actions) pour que `ci.yml` et `supabase-migrations.yml` fonctionnent. Ce dernier requiert en
  plus `SUPABASE_ACCESS_TOKEN` et `SUPABASE_PROJECT_REF`.

## Notes

- `types/database.ts` est un miroir écrit à la main du schéma SQL ; une fois le projet Supabase
  lié, régénère-le avec `supabase gen types typescript --linked` pour rester synchronisé.
- Les URLs audio du seed (`https://example-cdn.test/...`) sont des placeholders — branche un
  vrai stockage (Supabase Storage, S3, Mux...) avant la mise en prod.
