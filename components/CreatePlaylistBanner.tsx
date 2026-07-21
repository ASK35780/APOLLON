"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreatePlaylistBanner({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Échec de la création.");
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <button
        className={`liked-banner${compact ? " compact" : ""}`}
        style={{ width: "100%", border: "none", textAlign: "left", font: "inherit", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.14 0.012 280)" strokeWidth={2.4}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="t">Créer une playlist</div>
          <div className="s">Organise tes titres à ta façon</div>
        </div>
      </button>

      {open && (
        <div className="create-group-row" style={{ marginTop: 10 }}>
          <input
            autoFocus
            placeholder="Nom de la playlist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button disabled={creating || !name.trim()} onClick={handleCreate}>
            {creating ? "…" : "Créer"}
          </button>
        </div>
      )}
      {error && (
        <p className="edit-upload-status error" style={{ marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
