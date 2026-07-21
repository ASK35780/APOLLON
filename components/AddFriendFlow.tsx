"use client";

import { useEffect, useState } from "react";
import { ProfilePhoto } from "@/components/ProfilePhoto";

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

// Search-and-send step only (no "name" step like CreateGroupFlow) — a
// friend request is direct, not tied to a group.
export function AddFriendFlow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: UserResult[]) => setSearchResults(data));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  async function sendRequest(person: UserResult) {
    setSendingId(person.id);
    setError(null);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: person.username }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de l'envoi");
      setSentIds((prev) => new Set(prev).add(person.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="create-group-flow">
      <div className="search-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input placeholder="Chercher un pseudo…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {searchResults.map((person) => {
        const sent = sentIds.has(person.id);
        return (
          <div key={person.id} className="cgf-person-row">
            <div className="avatar">
              <ProfilePhoto
                url={person.avatar_url}
                c1="oklch(0.6 0.14 55)"
                c2="oklch(0.65 0.15 75)"
                pattern="e"
                alt={person.display_name}
              />
            </div>
            <div className="meta">
              <div className="t">{person.display_name}</div>
              <div className="s">@{person.username}</div>
            </div>
            <button className="cgf-add-btn" disabled={sent || sendingId === person.id} onClick={() => sendRequest(person)}>
              {sent ? "Envoyée" : sendingId === person.id ? "…" : "Ajouter"}
            </button>
          </div>
        );
      })}

      {error && (
        <p className="edit-upload-status error" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
