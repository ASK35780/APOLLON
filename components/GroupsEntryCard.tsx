"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session-store";

export function GroupsEntryCard({ mini = false }: { mini?: boolean }) {
  const router = useRouter();
  const isGuest = useSessionStore((s) => s.isGuest);

  return (
    <button
      className={`liked-banner${mini ? " mini" : ""}`}
      style={{ width: "100%", border: "none", textAlign: "left", font: "inherit", cursor: "pointer" }}
      onClick={() => router.push(isGuest ? "/login" : "/discussion")}
    >
      <div className="ic">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.14 0.012 280)" strokeWidth={2.2}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className="t">Playlists entre amis</div>
        <div className="s">Groupes sur invitation, écoute synchronisée</div>
      </div>
    </button>
  );
}
