"use client";

import { useEffect, useRef, useState } from "react";
import type { FriendGroupMessageWithSender } from "@/types/database";

interface GroupChatProps {
  groupId: string;
  userId: string;
  messages: FriendGroupMessageWithSender[];
  open: boolean;
  onClose: () => void;
}

export function GroupChat({ groupId, userId, messages, open, onClose }: GroupChatProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");
    try {
      await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`group-chat-view${open ? " open" : ""}`}>
      <div className="groups-top" style={{ padding: "0 22px 14px" }}>
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Chat du groupe</h2>
      </div>

      <div className="gc-messages" ref={listRef}>
        {messages.length === 0 ? (
          <div className="gc-empty">Aucun message — le chat se vide dès que tout le monde a quitté la room.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`gc-message${m.user_id === userId ? " own" : ""}`}>
              {m.user_id !== userId && <div className="sender">{m.sender?.display_name ?? "?"}</div>}
              <div className="bubble">{m.body}</div>
            </div>
          ))
        )}
      </div>

      <div className="gc-input-row">
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
