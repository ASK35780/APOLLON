"use client";

import { useState } from "react";
import { SocialLinksOverlay } from "@/components/SocialLinksOverlay";
import { PlansOverlay } from "@/components/PlansOverlay";
import { AccountInfoOverlay } from "@/components/AccountInfoOverlay";
import { SoundSettingsOverlay } from "@/components/SoundSettingsOverlay";

// Placeholder destination for now — "Nous contacter" doesn't have its own
// screen yet, just the entry point.
export function SettingsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [socialOpen, setSocialOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);

  return (
    <div className={`settings-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Paramètres</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="profile-menu" style={{ marginTop: 10 }}>
        <button className="profile-menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 5l8 7 8-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="t">Nous contacter</div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="profile-menu-item" onClick={() => setAccountOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="t">Mes informations</div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="profile-menu-item" onClick={() => setSoundOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18V5l11-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="17" cy="16" r="3" />
          </svg>
          <div className="t">Lecture et son</div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="profile-menu-item" onClick={() => setSocialOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="17" cy="6" r="2.5" />
            <circle cx="17" cy="18" r="2.5" />
            <path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" strokeLinecap="round" />
          </svg>
          <div className="t">Nos réseaux</div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="profile-menu-item" onClick={() => setPlansOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.1 5.8 20.5l1.5-6.8-5.1-4.7 6.9-.7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="t">Forfaits</div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <SocialLinksOverlay open={socialOpen} onClose={() => setSocialOpen(false)} />
      <PlansOverlay open={plansOpen} onClose={() => setPlansOpen(false)} />
      <AccountInfoOverlay open={accountOpen} onClose={() => setAccountOpen(false)} />
      <SoundSettingsOverlay open={soundOpen} onClose={() => setSoundOpen(false)} />
    </div>
  );
}
