"use client";

import { ProfilePhoto } from "@/components/ProfilePhoto";
import { useUiStore } from "@/store/ui-store";
import type { Artist } from "@/types/database";

interface AppBarProps {
  identity: Pick<Artist, "cover_c1" | "cover_c2" | "cover_pattern">;
  avatarUrl: string | null;
}

export function AppBar({ identity, avatarUrl }: AppBarProps) {
  const openProfile = useUiStore((s) => s.openProfile);

  return (
    <div className="app-bar">
      <button className="avatar-btn" aria-label="Voir mon profil" onClick={openProfile}>
        <ProfilePhoto
          url={avatarUrl}
          c1={identity.cover_c1}
          c2={identity.cover_c2}
          pattern={identity.cover_pattern}
          alt="Mon profil"
        />
      </button>
    </div>
  );
}
