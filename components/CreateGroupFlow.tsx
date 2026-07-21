"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePhoto } from "@/components/ProfilePhoto";

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

type Step = "name" | "invite";

export function CreateGroupFlow({ onCreated }: { onCreated: (groupId: string) => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [creating, setCreating] = useState(false);
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

  function reset() {
    setStep("name");
    setGroupName("");
    setSearchQuery("");
    setSearchResults([]);
    setSelected([]);
    setError(null);
  }

  function addPerson(person: UserResult) {
    if (selected.some((p) => p.id === person.id)) return;
    setSelected((prev) => [...prev, person]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removePerson(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleCreate() {
    if (!groupName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      const json = (await res.json()) as { group?: { id: string }; error?: string };
      if (!res.ok || !json.group) {
        setError(json.error ?? "Échec de la création du groupe.");
        return;
      }

      await Promise.all(
        selected.map((person) =>
          fetch(`/api/groups/${json.group!.id}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: person.username }),
          })
        )
      );

      const createdGroupId = json.group.id;
      reset();
      router.refresh();
      onCreated(createdGroupId);
    } finally {
      setCreating(false);
    }
  }

  const availableResults = searchResults.filter((r) => !selected.some((p) => p.id === r.id));

  return (
    <div className="create-group-flow">
      {step === "name" ? (
        <div className="create-group-row">
          <input
            placeholder="Nom du groupe"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && groupName.trim() && setStep("invite")}
          />
          <button disabled={!groupName.trim()} onClick={() => setStep("invite")}>
            Suivant
          </button>
        </div>
      ) : (
        <>
          <p className="cgf-hint" style={{ marginTop: 0 }}>
            Ajoute des amis à &quot;{groupName}&quot; — ils recevront une invitation à accepter.
          </p>

          {selected.length > 0 && (
            <div className="cgf-selected-list">
              {selected.map((p) => (
                <div key={p.id} className="cgf-chip">
                  @{p.username}
                  <button aria-label={`Retirer @${p.username}`} onClick={() => removePerson(p.id)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input placeholder="Chercher un pseudo…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {availableResults.map((person) => (
            <div key={person.id} className="cgf-person-row">
              <div className="avatar">
                <ProfilePhoto url={person.avatar_url} c1="oklch(0.6 0.14 55)" c2="oklch(0.65 0.15 75)" pattern="e" alt={person.display_name} />
              </div>
              <div className="meta">
                <div className="t">{person.display_name}</div>
                <div className="s">@{person.username}</div>
              </div>
              <button className="cgf-add-btn" onClick={() => addPerson(person)}>
                Ajouter
              </button>
            </div>
          ))}

          {error && (
            <p className="edit-upload-status error" style={{ marginTop: 8 }}>
              {error}
            </p>
          )}

          <div className="cgf-actions">
            <button className="back" onClick={() => setStep("name")}>
              Retour
            </button>
            <button className="primary" disabled={creating} onClick={handleCreate}>
              {creating
                ? "Création…"
                : selected.length > 0
                  ? `Créer et inviter (${selected.length})`
                  : "Créer sans inviter"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
