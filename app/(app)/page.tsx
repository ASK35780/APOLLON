import { createClient } from "@/lib/supabase/server";
import { getAllTracks } from "@/lib/queries/tracks";
import { getUserPlaylists } from "@/lib/queries/playlists";
import { getRecentlyPlayed } from "@/lib/queries/history";
import { ShelfCard } from "@/components/ShelfCard";
import { TrackRow } from "@/components/TrackRow";
import { LikedBanner } from "@/components/LikedBanner";
import { CreatePlaylistBanner } from "@/components/CreatePlaylistBanner";
import { PlaylistShelfCard } from "@/components/PlaylistShelfCard";
import { NotificationsBellButton } from "@/components/NotificationsBellButton";
import { QuestsButton } from "@/components/QuestsButton";
import type { TrackWithArtist } from "@/types/database";

const isTrack = (t: TrackWithArtist | undefined): t is TrackWithArtist => t !== undefined;

function greeting(hour: number) {
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tracks, playlists, recentlyPlayed] = await Promise.all([
    getAllTracks(),
    user ? getUserPlaylists(user.id) : Promise.resolve([]),
    user ? getRecentlyPlayed(user.id) : Promise.resolve([]),
  ]);

  const resumeShelf = [tracks[1], tracks[4], tracks[6]].filter(isTrack);
  const forYouList = [tracks[0], tracks[3], tracks[1], tracks[5]].filter(isTrack);
  const newShelf = [tracks[2], tracks[5], tracks[7], tracks[3]].filter(isTrack);

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-row">
          <div>
            <div className="eyebrow">{greeting(new Date().getHours())}</div>
            <h1>Ton écoute</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <QuestsButton />
            <NotificationsBellButton />
          </div>
        </div>
      </div>

      <div className="banner-row">
        <LikedBanner allTracks={tracks} compact />
        <CreatePlaylistBanner compact />
      </div>

      {playlists.length > 0 && (
        <>
          <div className="shelf-title">Tes playlists</div>
          <div className="shelf">
            {playlists.map((playlist) => (
              <PlaylistShelfCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </>
      )}

      {recentlyPlayed.length > 0 && (
        <>
          <div className="shelf-title">Écouté récemment</div>
          <div className="shelf">
            {recentlyPlayed.map((track) => (
              <ShelfCard key={track.id} track={track} queue={recentlyPlayed} />
            ))}
          </div>
        </>
      )}

      <div className="shelf-title">
        Reprendre <span className="link">Tout voir</span>
      </div>
      <div className="shelf">
        {resumeShelf.map((track) => (
          <ShelfCard key={track.id} track={track} queue={tracks} />
        ))}
      </div>

      <div className="shelf-title">Pour toi</div>
      <div>
        {forYouList.map((track) => (
          <TrackRow key={track.id} track={track} queue={tracks} />
        ))}
      </div>

      <div className="shelf-title">Nouveautés du moment</div>
      <div className="shelf">
        {newShelf.map((track) => (
          <ShelfCard key={track.id} track={track} queue={tracks} />
        ))}
      </div>
    </div>
  );
}
