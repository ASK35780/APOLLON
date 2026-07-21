"use client";

import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { usePlayerStore } from "@/store/player-store";
import { useDirectMessageChannel } from "@/lib/useDirectMessageChannel";
import { conversationKey } from "@/lib/conversation-key";
import type { DirectMessageWithTrack, Friend, TrackWithArtist } from "@/types/database";

interface DirectMessageOverlayProps {
  friend: Friend;
  userId: string;
  onClose: () => void;
}

export function DirectMessageOverlay({ friend, userId, onClose }: DirectMessageOverlayProps) {
  const friendId = friend.profile.id;
  const [messages, setMessages] = useState<DirectMessageWithTrack[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sharePickerOpen, setSharePickerOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState<TrackWithArtist[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const playQueue = usePlayerStore((s) => s.playQueue);

  async function fetchMessages() {
    const res = await fetch(`/api/messages/${friendId}`);
    if (res.ok) {
      const json = (await res.json()) as { messages: DirectMessageWithTrack[] };
      setMessages(json.messages);
    }
  }

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  useDirectMessageChannel(conversationKey(userId, friendId), fetchMessages);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const q = trackQuery.trim();
    if (!q) {
      setTrackResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/tracks/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: TrackWithArtist[]) => setTrackResults(data));
    }, 250);
    return () => clearTimeout(handle);
  }, [trackQuery]);

  async function sendMessage(payload: { body?: string; sharedTrackId?: string }) {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${friendId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) await fetchMessages();
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    await sendMessage({ body: trimmed });
  }

  async function handleShareTrack(track: TrackWithArtist) {
    setSharePickerOpen(false);
    setTrackQuery("");
    setTrackResults([]);
    await sendMessage({ sharedTrackId: track.id });
  }

  return (
    <div className="group-chat-view open">
      <div className="groups-top" style={{ padding: "0 22px 14px" }}>
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>{friend.profile.display_name}</h2>
      </div>

      <div className="gc-messages" ref={listRef}>
        {messages.length === 0 ? (
          <div className="gc-empty">Aucun message pour l&apos;instant — dis bonjour à {friend.profile.display_name} !</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`gc-message${m.sender_id === userId ? " own" : ""}`}>
              {m.body && <div className="bubble">{m.body}</div>}
              {m.shared_track && (
                <button
                  className="dm-shared-track"
                  onClick={() => playQueue([m.shared_track!], 0)}
                  aria-label={`Écouter ${m.shared_track.title}`}
                >
                  <CoverArt c1={m.shared_track.cover_c1} c2={m.shared_track.cover_c2} pattern={m.shared_track.cover_pattern} />
                  <div className="meta">
                    <div className="t">{m.shared_track.title}</div>
                    <div className="a">{m.shared_track.artist.name}</div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {sharePickerOpen && (
        <div className="dm-share-picker">
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Chercher un titre à partager…"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              autoFocus
            />
          </div>
          {trackResults.length > 0 && (
            <div className="grm-search-results">
              {trackResults.map((t) => (
                <button key={t.id} className="grm-search-result" onClick={() => handleShareTrack(t)}>
                  <CoverArt c1={t.cover_c1} c2={t.cover_c2} pattern={t.cover_pattern} />
                  <div className="meta">
                    <div className="t">{t.title}</div>
                    <div className="a">{t.artist.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="gc-input-row">
        <button
          type="button"
          aria-label="Partager un titre"
          className="dm-share-btn"
          onClick={() => setSharePickerOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </button>
        <input
          placeholder="Écrire un message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button disabled={!body.trim() || sending} onClick={handleSend} aria-label="Envoyer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
