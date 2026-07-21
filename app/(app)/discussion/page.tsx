import { createClient } from "@/lib/supabase/server";
import { getMyGroups, getPendingInvites } from "@/lib/queries/groups";
import { getFriends, getPendingFriendRequests } from "@/lib/queries/friends";
import { DiscussionView } from "@/components/DiscussionView";

export default async function DiscussionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="view">
        <div className="view-header">
          <h1>Playlists entre amis</h1>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
          Connecte-toi pour créer un groupe, inviter des amis et écouter en même temps qu'eux.
        </p>
      </div>
    );
  }

  const [groups, pendingInvites, pendingFriendRequests, friends] = await Promise.all([
    getMyGroups(user.id),
    getPendingInvites(user.id),
    getPendingFriendRequests(user.id),
    getFriends(user.id),
  ]);

  return (
    <DiscussionView
      userId={user.id}
      groups={groups}
      pendingInvites={pendingInvites}
      pendingFriendRequests={pendingFriendRequests}
      friends={friends}
    />
  );
}
