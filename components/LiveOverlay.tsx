"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CoverArt } from "@/components/CoverArt";
import { Paywall } from "@/components/Paywall";
import { useUiStore } from "@/store/ui-store";
import { useSessionStore } from "@/store/session-store";
import { useLiveChatChannel } from "@/lib/useLiveChatChannel";
import { useLiveDonationChannel } from "@/lib/useLiveDonationChannel";
import type { LiveChatMessageWithSender, LiveShowWithArtist } from "@/types/database";

interface LiveOverlayProps {
  now: LiveShowWithArtist[];
  upcoming: LiveShowWithArtist[];
  initialUnlockedIds: string[];
}

const HEART_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.6 4.4 5.1c2.3-1.2 4.8-.4 6.2 1.4l1.4 1.8 1.4-1.8c1.4-1.8 3.9-2.6 6.2-1.4 2.8 1.5 3.4 4.9 1.7 7.7C18.7 16.7 12 21 12 21z" />
  </svg>
);

const EYE_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SEND_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
  </svg>
);

function formatViewers(count: number) {
  return (count / 1000).toFixed(1).replace(".", ",") + "k";
}

export function LiveOverlay({ now, upcoming, initialUnlockedIds }: LiveOverlayProps) {
  const open = useUiStore((s) => s.liveOpen);
  const close = useUiStore((s) => s.closeLive);
  const isGuest = useSessionStore((s) => s.isGuest);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [unlockedIds, setUnlockedIds] = useState(new Set(initialUnlockedIds));
  const [watching, setWatching] = useState<LiveShowWithArtist | null>(null);
  const [paying, setPaying] = useState<LiveShowWithArtist | null>(null);
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>(
    Object.fromEntries(now.map((s) => [s.id, s.viewer_count]))
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [chatMessages, setChatMessages] = useState<LiveChatMessageWithSender[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [donationCount, setDonationCount] = useState(0);
  const [donating, setDonating] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  // Coming back from a successful Stripe Checkout redirect (see
  // success_url in app/api/stripe/checkout/route.ts). The webhook writes
  // the purchase asynchronously, so poll briefly until it lands.
  useEffect(() => {
    const unlockedParam = searchParams.get("unlocked");
    if (!unlockedParam) return;

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts += 1;
      const res = await fetch(`/api/live/purchase?liveShowId=${unlockedParam}`);
      const { unlocked } = (await res.json()) as { unlocked: boolean };
      if (unlocked || attempts > 10) {
        clearInterval(poll);
        if (unlocked) {
          setUnlockedIds((prev) => new Set(prev).add(unlockedParam));
          const show = now.find((s) => s.id === unlockedParam);
          if (show) setWatching(show);
          useUiStore.getState().openLive();
        }
        router.replace("/live");
      }
    }, 1000);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!watching) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      setViewerCounts((prev) => ({
        ...prev,
        [watching.id]: (prev[watching.id] ?? watching.viewer_count) + Math.floor(Math.random() * 12),
      }));
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [watching]);

  // Load chat history + donation count whenever a different show is opened.
  useEffect(() => {
    setChatMessages([]);
    setDonationCount(0);
    if (!watching) return;
    const liveShowId = watching.id;
    let cancelled = false;
    Promise.all([
      fetch(`/api/live/${liveShowId}/chat`).then((r) => r.json()),
      fetch(`/api/live/${liveShowId}/donate`).then((r) => r.json()),
    ]).then(([chatData, donateData]) => {
      if (cancelled) return;
      setChatMessages(chatData.messages ?? []);
      setDonationCount(donateData.count ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [watching]);

  useEffect(() => {
    chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  // Postgres Changes only carries the raw new row (no joined sender
  // profile), so a new chat message just triggers a refetch of the thread.
  useLiveChatChannel(watching?.id ?? null, () => {
    if (!watching) return;
    fetch(`/api/live/${watching.id}/chat`)
      .then((r) => r.json())
      .then((d) => setChatMessages(d.messages ?? []));
  });
  useLiveDonationChannel(watching?.id ?? null, () => setDonationCount((c) => c + 1));

  function handleCardClick(show: LiveShowWithArtist) {
    // A free show (price_cents 0) needs no purchase record at all — skip
    // the paywall/Stripe checkout entirely for instant access.
    if (show.price_cents === 0 || unlockedIds.has(show.id)) setWatching(show);
    else setPaying(show);
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!watching || !chatInput.trim() || chatSending) return;
    const liveShowId = watching.id;
    const body = chatInput.trim();
    setChatInput("");
    setChatSending(true);
    try {
      // No manual refetch here: the realtime channel below fires on this
      // insert too (Supabase delivers it back to the sender, not just other
      // viewers), so updating state here as well would be redundant.
      await fetch(`/api/live/${liveShowId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
    } finally {
      setChatSending(false);
    }
  }

  async function handleDonate() {
    if (!watching || donating) return;
    if (isGuest) {
      router.push("/login");
      return;
    }
    const liveShowId = watching.id;
    setDonating(true);
    try {
      // No optimistic increment: the realtime channel below also receives
      // this insert (Supabase delivers it back to the sender), so bumping
      // the count here too would double-count every donation.
      await fetch(`/api/live/${liveShowId}/donate`, { method: "POST" });
    } finally {
      setDonating(false);
    }
  }

  return (
    <div className={`live-view${open ? " open" : ""}`}>
      <div className="live-top">
        <button aria-label="Fermer" onClick={close}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Live</h2>
      </div>

      <div className="live-body">
        <div className="live-section-title">En ce moment</div>
        {now.map((show) => (
          <button key={show.id} className="live-card" onClick={() => handleCardClick(show)}>
            <div className="live-cover-wrap">
              <CoverArt c1={show.cover_c1} c2={show.cover_c2} pattern={show.cover_pattern} />
              <div className="badge-live">
                <span className="dot" />
                LIVE
              </div>
              <div className="live-viewers-badge">{formatViewers(viewerCounts[show.id] ?? show.viewer_count)}</div>
            </div>
            <div className="live-card-info">
              <div className="t">{show.title}</div>
              <div className="a">{show.artist.name}</div>
              <div className="desc">{show.description}</div>
              <div className="v">{formatViewers(viewerCounts[show.id] ?? show.viewer_count)} spectateurs en direct</div>
            </div>
          </button>
        ))}

        <div className="live-section-title">À venir</div>
        {upcoming.map((show) => (
          <div key={show.id} className="live-card" style={{ cursor: "default" }}>
            <div className="live-cover-wrap">
              <CoverArt c1={show.cover_c1} c2={show.cover_c2} pattern={show.cover_pattern} />
              <div className="live-date-badge">
                {new Date(show.scheduled_at).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="live-card-info">
              <div className="t">{show.title}</div>
              <div className="a">{show.artist.name}</div>
              <div className="desc">{show.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={`live-watch${watching ? " open" : ""}`}>
        <div className="live-watch-top">
          <button aria-label="Retour" onClick={() => setWatching(null)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(246,241,231,0.6)" }}>
            Concert en direct
          </div>
          <div style={{ width: 34 }} />
        </div>
        {watching && (
          <>
            <CoverArt c1={watching.cover_c1} c2={watching.cover_c2} pattern={watching.cover_pattern} className="live-stage">
              <div className="tag">
                <span className="dot" />
                EN DIRECT
              </div>
            </CoverArt>
            <div className="live-watch-meta">
              <div className="t">{watching.title}</div>
              <div className="a">{watching.artist.name}</div>
            </div>

            <div className="live-stats-bar">
              <div className="live-stat-pill">
                {EYE_ICON}
                {formatViewers(viewerCounts[watching.id] ?? watching.viewer_count)} spectateurs
              </div>
              <button className="live-stat-pill donate" disabled={donating} onClick={handleDonate}>
                {HEART_ICON}
                {donationCount} don{donationCount > 1 ? "s" : ""}
              </button>
            </div>

            <div className="live-chat" ref={chatListRef}>
              {chatMessages.length === 0 ? (
                <p className="live-chat-empty">Sois le premier à écrire dans le chat.</p>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="live-chat-msg">
                    <span className="live-chat-name">{m.sender.display_name}</span>
                    <span className="live-chat-body">{m.body}</span>
                  </div>
                ))
              )}
            </div>

            {isGuest ? (
              <button className="live-chat-guest-cta" onClick={() => router.push("/login")}>
                Connecte-toi pour discuter et envoyer des dons
              </button>
            ) : (
              <form className="live-chat-input" onSubmit={handleSendChat}>
                <input
                  placeholder="Écrire dans le chat…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={300}
                />
                <button type="submit" aria-label="Envoyer" disabled={!chatInput.trim() || chatSending}>
                  {SEND_ICON}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <Paywall show={paying} onCancel={() => setPaying(null)} />
    </div>
  );
}
