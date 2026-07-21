// Imports Creative-Commons-licensed tracks from Jamendo into Supabase
// (Storage + tracks/artists tables) for genre variety alongside the
// archive.org classical import.
//
// Requires a free Jamendo API client_id: https://devportal.jamendo.com
// Run with: JAMENDO_CLIENT_ID=xxxx node --env-file=.env.local scripts/import-jamendo.mjs

import { assertEnv, insertTrack, pickCover, sleep, slugify, trackExistsByTitle, uploadAudio, upsertArtist } from "./import-lib.mjs";

assertEnv();

const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
if (!CLIENT_ID) {
  console.error("Missing JAMENDO_CLIENT_ID. Get a free one at https://devportal.jamendo.com and re-run:\n" +
    "  JAMENDO_CLIENT_ID=xxxx node --env-file=.env.local scripts/import-jamendo.mjs");
  process.exit(1);
}

// A spread of tags for genre variety — each pulls its own batch of popular
// CC-licensed tracks from Jamendo's catalog.
const TAGS = ["pop", "electronic", "rock", "jazz", "acoustic", "hiphop", "ambient", "indie"];
const TRACKS_PER_TAG = 8;

async function searchJamendo(tag) {
  const url =
    `https://api.jamendo.com/v3.0/tracks/?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&format=json&limit=${TRACKS_PER_TAG}&fuzzytags=${encodeURIComponent(tag)}` +
    `&audioformat=mp32&order=popularity_total&include=musicinfo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jamendo search failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return json.results ?? [];
}

async function importTrack(track, index) {
  const title = track.name?.trim();
  const artistName = track.artist_name?.trim();
  if (!title || !artistName || !track.audio) return false;

  if (await trackExistsByTitle(title)) {
    console.log(`⏭  "${title}" already imported, skipping.`);
    return false;
  }

  console.log(`   downloading "${title}" — ${artistName}`);
  const audioRes = await fetch(track.audio);
  if (!audioRes.ok) {
    console.log(`   download failed (${audioRes.status}), skipping.`);
    return false;
  }
  const buffer = Buffer.from(await audioRes.arrayBuffer());

  const destPath = `jamendo/${slugify(title)}-${Date.now()}.mp3`;
  const publicUrl = await uploadAudio(buffer, destPath);

  const cover = pickCover(index);
  const artistId = await upsertArtist(artistName, cover);
  await insertTrack({
    title,
    artistId,
    durationSeconds: track.duration || 180,
    audioUrl: publicUrl,
    cover,
  });

  console.log(`   ✓ imported (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  return true;
}

async function main() {
  let imported = 0;
  let index = 0;
  for (const tag of TAGS) {
    console.log(`🔎 tag: ${tag}`);
    let results = [];
    try {
      results = await searchJamendo(tag);
    } catch (err) {
      console.error(`   ✗ ${err.message}`);
      continue;
    }
    for (const track of results) {
      try {
        if (await importTrack(track, index)) imported++;
      } catch (err) {
        console.error(`   ✗ error: ${err.message}`);
      }
      index++;
      await sleep(300);
    }
  }
  console.log(`\nDone — imported ${imported} tracks.`);
}

main();
