// Imports well-known, clearly public-domain classical recordings from
// archive.org into Supabase (Storage + tracks/artists tables).
//
// Run with: node --env-file=.env.local scripts/import-archive-org.mjs
//
// Every URL used comes from archive.org's own search/metadata API
// responses at run time — nothing is hardcoded or guessed.

import { assertEnv, insertTrack, pickCover, sleep, slugify, trackExistsByTitle, uploadAudio, upsertArtist } from "./import-lib.mjs";

assertEnv();

// [title we'll store, composer (used as the track's artist), archive.org search phrase]
const PIECES = [
  ["Symphonie n°5 — Allegro con brio", "Ludwig van Beethoven", "Beethoven Symphony No 5"],
  ["Für Elise", "Ludwig van Beethoven", "Beethoven Fur Elise"],
  ["Symphonie n°9 — Ode à la joie", "Ludwig van Beethoven", "Beethoven Symphony No 9 Choral"],
  ["Sonate au clair de lune", "Ludwig van Beethoven", "Beethoven Moonlight Sonata"],
  ["Symphonie n°6 — Pastorale", "Ludwig van Beethoven", "Beethoven Symphony No 6 Pastoral"],
  ["Eine kleine Nachtmusik", "Wolfgang Amadeus Mozart", "Mozart Eine kleine Nachtmusik"],
  ["Symphonie n°40", "Wolfgang Amadeus Mozart", "Mozart Symphony No 40"],
  ["Requiem — Lacrimosa", "Wolfgang Amadeus Mozart", "Mozart Requiem Lacrimosa"],
  ["La Flûte enchantée — Ouverture", "Wolfgang Amadeus Mozart", "Mozart Magic Flute Overture"],
  ["Toccata et fugue en ré mineur", "Johann Sebastian Bach", "Bach Toccata and Fugue D minor"],
  ["Air sur la corde de sol", "Johann Sebastian Bach", "Bach Air on the G String"],
  ["Concerto brandebourgeois n°3", "Johann Sebastian Bach", "Bach Brandenburg Concerto No 3"],
  ["Les Quatre Saisons — Le Printemps", "Antonio Vivaldi", "Vivaldi Four Seasons Spring"],
  ["Les Quatre Saisons — L'Hiver", "Antonio Vivaldi", "Vivaldi Four Seasons Winter"],
  ["Nocturne Op. 9 No. 2", "Frédéric Chopin", "Chopin Nocturne Op 9 No 2"],
  ["Valse minute", "Frédéric Chopin", "Chopin Minute Waltz"],
  ["Clair de lune", "Claude Debussy", "Debussy Clair de Lune"],
  ["Le Lac des cygnes", "Piotr Ilitch Tchaïkovski", "Tchaikovsky Swan Lake"],
  ["Casse-Noisette — Danse de la fée dragée", "Piotr Ilitch Tchaïkovski", "Tchaikovsky Nutcracker Sugar Plum Fairy"],
  ["Ouverture 1812", "Piotr Ilitch Tchaïkovski", "Tchaikovsky 1812 Overture"],
  ["Le Beau Danube bleu", "Johann Strauss II", "Strauss Blue Danube"],
  ["Peer Gynt — Matin", "Edvard Grieg", "Grieg Peer Gynt Morning Mood"],
  ["Peer Gynt — Dans l'antre du roi de la montagne", "Edvard Grieg", "Grieg Hall of the Mountain King"],
  ["Danse hongroise n°5", "Johannes Brahms", "Brahms Hungarian Dance No 5"],
  ["La Chevauchée des Walkyries", "Richard Wagner", "Wagner Ride of the Valkyries"],
  ["Canon en ré majeur", "Johann Pachelbel", "Pachelbel Canon in D"],
  ["Les Planètes — Jupiter", "Gustav Holst", "Holst The Planets Jupiter"],
  ["Guillaume Tell — Ouverture", "Gioachino Rossini", "Rossini William Tell Overture"],
  ["Symphonie n°9 — Du Nouveau Monde", "Antonín Dvořák", "Dvorak Symphony No 9 New World"],
  ["Le Carnaval des animaux", "Camille Saint-Saëns", "Saint-Saens Carnival of the Animals"],
  ["Water Music", "George Frideric Handel", "Handel Water Music"],
  ["Le Messie — Hallelujah", "George Frideric Handel", "Handel Messiah Hallelujah"],
];

async function searchArchiveOrg(query) {
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(`title:(${query}) AND mediatype:audio`) +
    "&fl[]=identifier&fl[]=title&sort[]=downloads+desc&rows=5&output=json";
  const res = await fetch(url);
  const json = await res.json();
  return json.response?.docs ?? [];
}

function parseLength(length) {
  if (!length) return null;
  if (typeof length === "string" && length.includes(":")) {
    return length
      .split(":")
      .map(Number)
      .reduce((acc, v) => acc * 60 + v, 0);
  }
  const n = parseFloat(length);
  return Number.isNaN(n) ? null : n;
}

async function findUsableAudioFile(identifier) {
  const res = await fetch(`https://archive.org/metadata/${identifier}`);
  const json = await res.json();
  const files = json.files || [];
  for (const file of files) {
    const format = (file.format || "").toLowerCase();
    if (!format.includes("mp3")) continue;
    const seconds = parseLength(file.length);
    if (seconds && seconds >= 45 && seconds <= 25 * 60) {
      return { name: file.name, seconds };
    }
  }
  return null;
}

async function importPiece([title, composer, query], index) {
  if (await trackExistsByTitle(title)) {
    console.log(`⏭  "${title}" already imported, skipping.`);
    return false;
  }

  console.log(`🔎 ${query}`);
  const docs = await searchArchiveOrg(query);
  if (!docs.length) {
    console.log("   no archive.org results, skipping.");
    return false;
  }

  let picked = null;
  for (const doc of docs.slice(0, 4)) {
    const file = await findUsableAudioFile(doc.identifier);
    if (file) {
      picked = { doc, file };
      break;
    }
  }
  if (!picked) {
    console.log("   no usable mp3 file found, skipping.");
    return false;
  }

  const { doc, file } = picked;
  const downloadUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(file.name)}`;
  console.log(`   downloading ${downloadUrl}`);
  const audioRes = await fetch(downloadUrl);
  if (!audioRes.ok) {
    console.log(`   download failed (${audioRes.status}), skipping.`);
    return false;
  }
  const buffer = Buffer.from(await audioRes.arrayBuffer());

  const destPath = `classical/${slugify(title)}-${Date.now()}.mp3`;
  const publicUrl = await uploadAudio(buffer, destPath);

  const cover = pickCover(index);
  const artistId = await upsertArtist(composer, cover);
  await insertTrack({ title, artistId, durationSeconds: file.seconds, audioUrl: publicUrl, cover });

  console.log(`   ✓ imported (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
  return true;
}

async function main() {
  let imported = 0;
  for (let i = 0; i < PIECES.length; i++) {
    try {
      if (await importPiece(PIECES[i], i)) imported++;
    } catch (err) {
      console.error(`   ✗ error: ${err.message}`);
    }
    await sleep(400); // be polite to archive.org's API
  }
  console.log(`\nDone — imported ${imported}/${PIECES.length} tracks.`);
}

main();
