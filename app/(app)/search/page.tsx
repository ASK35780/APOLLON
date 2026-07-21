"use client";

import { useEffect, useState } from "react";
import { TrackRow } from "@/components/TrackRow";
import type { TrackWithArtist } from "@/types/database";

const GENRES = [
  { name: "Ambiance nuit", c1: "oklch(0.14 0.012 280)", c2: "oklch(0.78 0.16 75)" },
  { name: "Énergie", c1: "oklch(0.6 0.14 55)", c2: "oklch(0.65 0.15 75)" },
  { name: "Concentration", c1: "oklch(0.78 0.16 75)", c2: "oklch(0.14 0.012 280)" },
  { name: "Mélancolie", c1: "oklch(0.5 0.06 60)", c2: "oklch(0.14 0.012 280)" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackWithArtist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data: TrackWithArtist[]) => setResults(data))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const showGenres = query.trim().length === 0;

  return (
    <div className="view">
      <div className="view-header" style={{ paddingBottom: 6 }}>
        <h1>Rechercher</h1>
      </div>

      <div className="search-box">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          placeholder="Titres, artistes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!showGenres && (
        <div>
          {!loading && results.length === 0 && (
            <div style={{ color: "var(--muted)", fontSize: 13.5, padding: "20px 0" }}>
              Aucun résultat pour « {query} »
            </div>
          )}
          {results.map((track) => (
            <TrackRow key={track.id} track={track} queue={results} />
          ))}
        </div>
      )}

      {showGenres && (
        <div>
          <div className="shelf-title" style={{ marginTop: 6 }}>
            Parcourir par ambiance
          </div>
          <div className="genre-grid">
            {GENRES.map((genre) => (
              <div key={genre.name} className="genre-card" style={{ background: `linear-gradient(135deg, ${genre.c1}, ${genre.c2})` }}>
                {genre.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
