// Shared helpers for scripts/import-archive-org.mjs and
// scripts/import-jamendo.mjs — talks to Supabase Storage + REST (PostgREST)
// directly over HTTP using the service-role key, since these scripts run
// outside the Next.js app (no access to lib/supabase/*).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function assertEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: node --env-file=.env.local scripts/<script>.mjs"
    );
    process.exit(1);
  }
}

// Several amber/bronze shades so imported tracks aren't all identical,
// matching the rest of the app's palette (see the Apollon Charte Graphique
// handoff and supabase/migrations/0012_apollon_palette.sql).
export const AMBER_PALETTE = [
  ["oklch(0.14 0.012 280)", "oklch(0.78 0.16 75)"],
  ["oklch(0.78 0.16 75)", "oklch(0.65 0.15 75)"],
  ["oklch(0.6 0.14 55)", "oklch(0.7 0.13 90)"],
  ["oklch(0.5 0.06 60)", "oklch(0.14 0.012 280)"],
  ["oklch(0.7 0.13 90)", "oklch(0.78 0.16 75)"],
  ["oklch(0.85 0.1 85)", "oklch(0.6 0.14 55)"],
  ["oklch(0.65 0.15 75)", "oklch(0.78 0.16 75)"],
  ["oklch(0.78 0.16 75)", "oklch(0.72 0.14 65)"],
];
export const PATTERNS = ["a", "b", "c", "d", "e"];

export function pickCover(index) {
  const cover = AMBER_PALETTE[index % AMBER_PALETTE.length];
  const pattern = PATTERNS[index % PATTERNS.length];
  return { c1: cover[0], c2: cover[1], pattern };
}

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadAudio(buffer, destPath, contentType = "audio/mpeg") {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/track-audio/${destPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/track-audio/${destPath}`;
}

export async function upsertArtist(name, cover) {
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/artists?name=eq.${encodeURIComponent(name)}&select=id&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const existing = await getRes.json();
  if (existing.length) return existing[0].id;

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/artists`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ name, cover_c1: cover.c1, cover_c2: cover.c2, cover_pattern: cover.pattern }),
  });
  if (!insertRes.ok) throw new Error(`Artist insert failed: ${await insertRes.text()}`);
  const [row] = await insertRes.json();
  return row.id;
}

export async function trackExistsByTitle(title) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tracks?title=eq.${encodeURIComponent(title)}&select=id&limit=1`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  const rows = await res.json();
  return rows.length > 0;
}

export async function insertTrack({ title, artistId, durationSeconds, audioUrl, cover }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tracks`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      title,
      artist_id: artistId,
      duration_seconds: Math.max(1, Math.round(durationSeconds)),
      audio_url: audioUrl,
      cover_c1: cover.c1,
      cover_c2: cover.c2,
      cover_pattern: cover.pattern,
    }),
  });
  if (!res.ok) throw new Error(`Track insert failed: ${await res.text()}`);
}
