"use client";

import { useState } from "react";
import { CoverArt } from "@/components/CoverArt";
import { useSessionStore } from "@/store/session-store";
import type { LiveShowWithArtist } from "@/types/database";

interface PaywallProps {
  show: LiveShowWithArtist | null;
  onCancel: () => void;
}

export function Paywall({ show, onCancel }: PaywallProps) {
  const [loading, setLoading] = useState(false);
  const isGuest = useSessionStore((s) => s.isGuest);

  async function handlePay() {
    if (!show) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveShowId: show.id }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  const priceLabel = show ? (show.price_cents / 100).toFixed(2).replace(".", ",") : "";

  return (
    <div className={`paywall${show ? " open" : ""}`}>
      <div className="paywall-backdrop" onClick={onCancel} />
      <div className="paywall-card">
        {show && (
          <>
            <CoverArt c1={show.cover_c1} c2={show.cover_c2} pattern={show.cover_pattern} className="paywall-cover" />
            <div className="paywall-badge">LIVE · ACCÈS PAYANT</div>
            <div className="paywall-title">{show.title}</div>
            <div className="paywall-artist">{show.artist.name}</div>
            {isGuest ? (
              <p className="paywall-text">Connecte-toi ou crée un compte pour débloquer ce live payant.</p>
            ) : (
              <p className="paywall-text">
                Ce concert en direct est réservé aux personnes ayant acheté l&apos;accès. Débloque le live pour le
                regarder en entier, du début à la fin.
              </p>
            )}
            {isGuest ? (
              <button className="paywall-pay" onClick={() => (window.location.href = "/login")}>
                Se connecter
              </button>
            ) : (
              <button className="paywall-pay" disabled={loading} onClick={handlePay}>
                {loading ? "Redirection…" : `Débloquer pour ${priceLabel} €`}
              </button>
            )}
            <button className="paywall-cancel" onClick={onCancel}>
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
