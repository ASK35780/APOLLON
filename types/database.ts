// Hand-written mirror of the Supabase schema in supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked,
// and replace this file with the generated `Database` type.

export type CoverPattern = "a" | "b" | "c" | "d" | "e";

export type ModerationStatus = "pending" | "approved" | "rejected";
// Alias kept for the application-form-specific type name used elsewhere.
export type ArtistApplicationStatus = ModerationStatus;

export interface Artist {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string | null;
  bio: string | null;
  banner_url: string | null;
  genres: string[];
  status: ModerationStatus;
  cover_c1: string;
  cover_c2: string;
  cover_pattern: CoverPattern;
  created_at: string;
  location: string | null;
  label: string | null;
  founded_year: number | null;
  website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
}

export interface ArtistApplication {
  id: string;
  user_id: string;
  artist_id: string | null;
  artist_name: string;
  genres: string[];
  bio: string | null;
  motivation: string | null;
  status: ArtistApplicationStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface TrackPlay {
  id: string;
  track_id: string;
  user_id: string | null;
  created_at: string;
}

export type MediaType = "audio" | "video";

export interface SubtitleLine {
  timestamp_seconds: number;
  text: string;
}

export interface SubtitleSubmission {
  id: string;
  track_id: string;
  submitted_by: string;
  lines: SubtitleLine[];
  status: ModerationStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  reason: string;
  created_at: string;
}

export interface ArtistTrackStats {
  track_id: string;
  title: string;
  status: ModerationStatus;
  plays: number;
  likes: number;
}

export interface ArtistStats {
  totalPlays: number;
  totalLikes: number;
  totalListeners: number;
  trackCount: number;
  tracks: ArtistTrackStats[];
}

export interface Track {
  id: string;
  title: string;
  artist_id: string;
  duration_seconds: number;
  audio_url: string;
  media_type: MediaType;
  status: ModerationStatus;
  cover_c1: string;
  cover_c2: string;
  cover_pattern: CoverPattern;
  created_at: string;
}

export interface LyricLine {
  id: string;
  track_id: string;
  timestamp_seconds: number;
  text: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_c1: string;
  cover_c2: string;
  cover_pattern: CoverPattern;
  is_public: boolean;
  created_at: string;
}

export interface PlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: TrackWithArtist[];
}

// ---- Artist follows (supabase/migrations/0022_artist_follows.sql) ----

export interface ArtistFollow {
  user_id: string;
  artist_id: string;
  created_at: string;
}

export interface Like {
  user_id: string;
  track_id: string;
  created_at: string;
}

export type LiveShowStatus = "upcoming" | "live" | "ended";

export interface LiveShow {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  status: LiveShowStatus;
  scheduled_at: string;
  price_cents: number;
  stripe_price_id: string | null;
  stream_url: string | null;
  cover_c1: string;
  cover_c2: string;
  cover_pattern: CoverPattern;
  viewer_count: number;
  created_at: string;
}

export interface LiveShowPurchase {
  id: string;
  user_id: string;
  live_show_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  purchased_at: string;
}

// ---- Live chat & donations (supabase/migrations/0020_live_chat_and_donations.sql) ----

export interface LiveChatMessage {
  id: string;
  live_show_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface LiveChatMessageWithSender extends LiveChatMessage {
  sender: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

export interface LiveShowDonation {
  id: string;
  live_show_id: string;
  user_id: string;
  created_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_c1: string;
  icon_c2: string;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  featured: boolean;
}

// ---- Friend groups (supabase/migrations/0005_friend_groups.sql) ----

export interface FriendGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FriendGroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export type FriendGroupInviteStatus = "pending" | "accepted" | "declined";

export interface FriendGroupInvite {
  id: string;
  group_id: string;
  invited_user_id: string;
  invited_by: string;
  status: FriendGroupInviteStatus;
  created_at: string;
}

export type FriendGroupTrackStatus = "active" | "proposed_add" | "proposed_remove";

export interface FriendGroupTrack {
  group_id: string;
  track_id: string;
  added_by: string;
  position: number;
  status: FriendGroupTrackStatus;
  created_at: string;
}

export interface FriendGroupTrackVote {
  group_id: string;
  track_id: string;
  user_id: string;
  vote: boolean;
  created_at: string;
}

export interface FriendGroupSession {
  group_id: string;
  current_track_id: string | null;
  is_playing: boolean;
  position_seconds: number;
  position_updated_at: string;
  controller_id: string | null;
  controller_is_temp: boolean;
  updated_at: string;
}

export interface FriendGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

// ---- Joined shapes used by the UI layer ----

export interface TrackWithArtist extends Track {
  artist: Pick<Artist, "id" | "name">;
}

export interface LiveShowWithArtist extends LiveShow {
  artist: Pick<Artist, "id" | "name">;
}

export interface FriendGroupTrackWithDetails extends FriendGroupTrack {
  track: TrackWithArtist;
  votes: Pick<FriendGroupTrackVote, "user_id" | "vote">[];
}

export interface FriendGroupMessageWithSender extends FriendGroupMessage {
  sender: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

export interface FriendGroupInviteWithDetails extends FriendGroupInvite {
  group: Pick<FriendGroup, "id" | "name">;
  inviter: Pick<Profile, "username" | "display_name">;
}

export interface FriendGroupSummary extends FriendGroup {
  member_count: number;
}

// ---- Direct friend requests (supabase/migrations/0013_friend_requests.sql) ----

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface FriendRequestWithRequester extends FriendRequest {
  requester: Pick<Profile, "username" | "display_name">;
}

// One accepted friend_requests row, resolved to whichever side isn't the
// current user — see lib/queries/friends.ts getFriends().
export interface Friend {
  requestId: string;
  profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

// ---- Direct messages (supabase/migrations/0015_direct_messages.sql) ----

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  shared_track_id: string | null;
  created_at: string;
}

export interface DirectMessageWithTrack extends DirectMessage {
  shared_track: TrackWithArtist | null;
}

// ---- Quests (supabase/migrations/0016_quests.sql) ----

export type QuestCategory = "ecoute" | "social" | "decouverte" | "creation";
export type QuestScope = "hebdomadaire" | "permanente";
export type QuestMetric =
  | "tracks_played"
  | "tracks_liked"
  | "playlists_created"
  | "friends_added"
  | "artists_discovered"
  | "groups_joined"
  | "night_listens"
  | "messages_sent"
  | "subtitles_submitted"
  | "became_artist"
  | "live_attended"
  | "account_age_days";

export interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: QuestCategory;
  scope: QuestScope;
  metric: QuestMetric;
  target_count: number;
  reward_xp: number;
  reward_badge_id: string | null;
  icon_c1: string;
  icon_c2: string;
  sort_order: number;
  created_at: string;
}

// Progress is computed live server-side (see quest_progress() in the
// migration) — never trust a client-supplied progress value.
export interface QuestWithProgress extends Quest {
  badge: Pick<Badge, "slug" | "name"> | null;
  progress: number;
  completed: boolean;
  periodKey: string;
  // Whether this quest has ever been claimed at least once, in any period —
  // unlike `completed` (current period only), this never resets, which is
  // what lets a constellation star (see lib/constellations.ts) stay lit
  // across weekly resets.
  everCompleted: boolean;
}

// Shape returned by GET /api/tracks/[trackId]/lyrics (omits track_id, which
// the client already knows from the track it requested lyrics for).
export type LyricCue = Pick<LyricLine, "id" | "timestamp_seconds" | "text">;
