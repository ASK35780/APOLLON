import { createClient } from "@/lib/supabase/server";
import { getLiveShows, getUnlockedLiveShowIds } from "@/lib/queries/live";

// This layout re-fetches account-scoped data (badges, playlists, quests,
// live purchases…) on every request. Without this, Next.js's fetch Data
// Cache can pin the Supabase REST responses from whenever a given route
// first rendered — a manual reload or router.refresh() then keeps replaying
// that same stale snapshot indefinitely instead of hitting the database
// again, which is exactly what made staff badge grants (and, retroactively,
// the "quest progress doesn't update" reports) look like a broken realtime
// pipeline when the data was actually just frozen server-side.
export const dynamic = "force-dynamic";
import { getAllBadges, getBadgesWithUnlockStatus, getFeaturedTracks, getProfile } from "@/lib/queries/profile";
import { getUserPlaylists } from "@/lib/queries/playlists";
import { getLikedTrackIds } from "@/lib/queries/tracks";
import { getArtistStats, getMyArtistProfile } from "@/lib/queries/artist";
import { getQuestsWithProgress } from "@/lib/queries/quests";
import { getFollowingCount } from "@/lib/queries/follows";
import { getPendingCounts, isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppBar } from "@/components/AppBar";
import { AccentSync } from "@/components/AccentSync";
import { PlayerTicker } from "@/components/PlayerTicker";
import { LikesHydrator } from "@/components/LikesHydrator";
import { SessionHydrator } from "@/components/SessionHydrator";
import { BadgesRealtimeSync } from "@/components/BadgesRealtimeSync";
import { QuestsHydrator } from "@/components/QuestsHydrator";
import { MiniPlayer } from "@/components/MiniPlayer";
import { TabBar } from "@/components/TabBar";
import { LiveOverlay } from "@/components/LiveOverlay";
import { ProfileOverlay } from "@/components/ProfileOverlay";
import { QuestsOverlay } from "@/components/QuestsOverlay";
import { ArtistOverlay } from "@/components/ArtistOverlay";
import { PlaylistOverlay } from "@/components/PlaylistOverlay";
import { QueueOverlay } from "@/components/QueueOverlay";
import { TrackOptionsMenu } from "@/components/TrackOptionsMenu";
import { ApollonWordmark } from "@/components/ApollonLogo";

// Placeholder identity art until profile customization ships — also used as
// the generic guest avatar. See components/ProfileOverlay.tsx.
const USER_IDENTITY = { cover_c1: "oklch(0.6 0.14 55)", cover_c2: "oklch(0.65 0.15 75)", cover_pattern: "e" as const };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests get the full browsing experience without an account; only
  // account-scoped data (profile, playlists, likes, badge progress, live
  // purchases, friend groups) falls back to empty defaults. Actions that
  // need an account redirect to /login from the client — see
  // store/likes-store.ts, components/Paywall.tsx and components/GroupsEntryCard.tsx.
  const [{ now, upcoming }, unlockedIds, profile, badges, playlists, likedTrackIds, artist, featuredTracks, followingCount] =
    await Promise.all([
      getLiveShows(),
      user ? getUnlockedLiveShowIds(user.id) : Promise.resolve(new Set<string>()),
      user ? getProfile(user.id) : Promise.resolve(null),
      user ? getBadgesWithUnlockStatus(user.id) : getAllBadges(),
      user ? getUserPlaylists(user.id) : Promise.resolve([]),
      user ? getLikedTrackIds(user.id) : Promise.resolve(new Set<string>()),
      user ? getMyArtistProfile(user.id) : Promise.resolve(null),
      user ? getFeaturedTracks(user.id) : Promise.resolve([]),
      user ? getFollowingCount(user.id) : Promise.resolve(0),
    ]);
  const artistStats = artist ? await getArtistStats(artist.id) : null;
  const quests = user ? await getQuestsWithProgress(user.id) : [];
  const userIsAdmin = isAdminEmail(user?.email);
  const adminPendingCount = userIsAdmin ? await getPendingCounts(createAdminClient()) : 0;

  return (
    <div className="app-shell">
      <PlayerTicker />
      <AccentSync />
      <SessionHydrator userId={user?.id ?? null} />
      <BadgesRealtimeSync userId={user?.id ?? null} />
      <LikesHydrator likedTrackIds={Array.from(likedTrackIds)} />
      <QuestsHydrator quests={quests} />

      <div className="status-bar">
        <ApollonWordmark markSize={16} textSize={15} />
      </div>

      <AppBar identity={USER_IDENTITY} avatarUrl={profile?.avatar_url ?? null} />

      <div className="views">{children}</div>

      <MiniPlayer />
      <TabBar />

      <LiveOverlay now={now} upcoming={upcoming} initialUnlockedIds={Array.from(unlockedIds)} />
      <ProfileOverlay
        profile={profile}
        playlistCount={playlists.length}
        followingCount={followingCount}
        badges={badges}
        featuredTracks={featuredTracks}
        artist={artist}
        artistStats={artistStats}
        isAdmin={userIsAdmin}
        adminPendingCount={adminPendingCount}
      />
      <QuestsOverlay />
      <ArtistOverlay />
      <PlaylistOverlay />
      <QueueOverlay />
      <TrackOptionsMenu />
    </div>
  );
}
