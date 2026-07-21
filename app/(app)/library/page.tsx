import { createClient } from "@/lib/supabase/server";
import { getUserPlaylists } from "@/lib/queries/playlists";
import { LikedBanner } from "@/components/LikedBanner";
import { GroupsEntryCard } from "@/components/GroupsEntryCard";
import { LibraryPlaylistCard } from "@/components/LibraryPlaylistCard";

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const playlists = user ? await getUserPlaylists(user.id) : [];

  return (
    <div className="view">
      <div className="view-header">
        <h1>Bibliothèque</h1>
      </div>

      <LikedBanner mini />
      <GroupsEntryCard mini />

      <div className="shelf-title" style={{ marginTop: 2 }}>
        Tes playlists
      </div>
      {!user && (
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
          Connecte-toi pour créer et retrouver tes playlists.
        </p>
      )}
      <div className="lib-grid">
        {playlists.map((playlist) => (
          <LibraryPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
}
