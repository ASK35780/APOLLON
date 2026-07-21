"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import { useQuestsStore } from "@/store/quests-store";
import { GalaxyView } from "@/components/GalaxyView";
import type { QuestCategory, QuestWithProgress } from "@/types/database";

const BACK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CATEGORY_ICON: Record<QuestCategory, React.ReactNode> = {
  ecoute: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" strokeLinecap="round" />
      <rect x="2" y="14" width="5" height="7" rx="2" />
      <rect x="17" y="14" width="5" height="7" rx="2" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  decouverte: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z" strokeLinejoin="round" />
    </svg>
  ),
  creation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.1 5.8 20.5l1.5-6.8-5.1-4.7 6.9-.7z" strokeLinejoin="round" />
    </svg>
  ),
};

function QuestCard({ quest, onClaim, busy }: { quest: QuestWithProgress; onClaim: (id: string) => void; busy: boolean }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target_count) * 100));
  const claimable = !quest.completed && quest.progress >= quest.target_count;

  return (
    <div className={`quest-card${quest.completed ? " done" : ""}`}>
      <div className="quest-icon" style={{ background: `linear-gradient(135deg, ${quest.icon_c1}, ${quest.icon_c2})` }}>
        {CATEGORY_ICON[quest.category]}
      </div>
      <div className="quest-body">
        <div className="quest-title-row">
          <div className="t">{quest.title}</div>
          {quest.completed && <span className="quest-done-tag">Terminée</span>}
        </div>
        <div className="quest-desc">{quest.description}</div>
        <div className="quest-progress-bar">
          <div className="fill" style={{ width: `${quest.completed ? 100 : pct}%` }} />
        </div>
        <div className="quest-meta-row">
          <span>
            {Math.min(quest.progress, quest.target_count)}/{quest.target_count}
          </span>
          <span className="quest-reward">
            +{quest.reward_xp} XP{quest.badge ? ` · badge « ${quest.badge.name} »` : ""}
          </span>
        </div>
        {claimable && (
          <button className="quest-claim-btn" disabled={busy} onClick={() => onClaim(quest.id)}>
            {busy ? "…" : "Réclamer la récompense"}
          </button>
        )}
      </div>
    </div>
  );
}

export function QuestsOverlay() {
  const router = useRouter();
  const open = useUiStore((s) => s.questsOpen);
  const onClose = useUiStore((s) => s.closeQuests);
  const quests = useQuestsStore((s) => s.quests);
  const markCompleted = useQuestsStore((s) => s.markCompleted);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justUnlockedBadge, setJustUnlockedBadge] = useState<string | null>(null);
  const [view, setView] = useState<"quests" | "galaxy">("quests");

  const weekly = quests.filter((q) => q.scope === "hebdomadaire");
  const permanent = quests.filter((q) => q.scope === "permanente");
  const xp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.reward_xp, 0);
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;

  async function handleClaim(questId: string) {
    setClaimingId(questId);
    setError(null);
    setJustUnlockedBadge(null);
    try {
      const res = await fetch(`/api/quests/${questId}/claim`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Échec de la validation");
      markCompleted(questId);
      const claimedQuest = quests.find((q) => q.id === questId);
      if (claimedQuest?.badge) setJustUnlockedBadge(claimedQuest.badge.name);
      // Refreshes server-fetched data elsewhere (badges on the profile,
      // artist stats, etc.) so a reward granted here shows up immediately
      // without the user needing to reload manually.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la validation");
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className={`quests-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          {BACK_ICON}
        </button>
        <h2>Quêtes</h2>
        <div style={{ width: 34 }} />
      </div>

      {quests.length === 0 ? (
        <p className="edit-section-hint" style={{ marginTop: 10 }}>
          Connecte-toi pour suivre tes quêtes et gagner de l&apos;XP.
        </p>
      ) : (
        <>
          <div className="admin-tabs" style={{ marginTop: 12 }}>
            <button className={`admin-tab${view === "quests" ? " active" : ""}`} onClick={() => setView("quests")}>
              Quêtes
            </button>
            <button className={`admin-tab${view === "galaxy" ? " active" : ""}`} onClick={() => setView("galaxy")}>
              Galaxie
            </button>
          </div>

          {view === "galaxy" ? (
            <GalaxyView />
          ) : (
            <>
              <div className="quests-header-stats">
                <div className="quests-level">Niveau {level}</div>
                <div className="quests-xp-bar">
                  <div className="fill" style={{ width: `${xpIntoLevel}%` }} />
                </div>
                <div className="quests-xp-label">
                  {xp} XP · encore {100 - xpIntoLevel} XP avant le niveau {level + 1}
                </div>
              </div>

              {error && <p className="artist-error">{error}</p>}
              {justUnlockedBadge && (
                <p className="edit-upload-status success" style={{ marginTop: 10 }}>
                  Badge débloqué : « {justUnlockedBadge} » !
                </p>
              )}

              <div className="grm-section-title" style={{ marginTop: 20 }}>
                <span>Cette semaine</span>
              </div>
              {weekly.map((q) => (
                <QuestCard key={q.id} quest={q} onClaim={handleClaim} busy={claimingId === q.id} />
              ))}

              <div className="grm-section-title" style={{ marginTop: 22 }}>
                <span>Quêtes permanentes</span>
              </div>
              {permanent.map((q) => (
                <QuestCard key={q.id} quest={q} onClaim={handleClaim} busy={claimingId === q.id} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
