"use client";

// Informational comparison only for now — no real subscription/billing
// wired up yet (the "Passer à Premium" button doesn't charge anything).
// Some of these (audio quality, ads, karaoke voice removal) describe intent
// for a future real playback pipeline; the app doesn't stream real audio
// yet, so nothing actually enforces them today.
const FEATURES = [
  "Choix précis des titres (pas seulement en aléatoire)",
  "Chat dans les playlists entre amis",
  "Sans publicité",
  "Accès aux concerts en direct",
  "Qualité audio maximale",
  "Paroles synchronisées sur les titres",
  "Mode karaoké (isoler la voix de l'instru)",
  "Personnalisation avancée du profil",
  "Badges et récompenses d'écoute",
];

const CHECK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CROSS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function PlanCard({ premium }: { premium: boolean }) {
  return (
    <div className={`plan-card${premium ? " premium" : ""}`}>
      {premium && <div className="plan-badge">Recommandé</div>}
      <div className="plan-card-header">
        <div className="plan-name">{premium ? "Premium" : "Gratuit"}</div>
        <div className="plan-price">
          {premium ? "9,99 €" : "0 €"}
          <span>/mois</span>
        </div>
      </div>
      <div className="plan-features">
        {FEATURES.map((feature) => (
          <div key={feature} className={`plan-feature-row${premium ? " included" : " excluded"}`}>
            <span className="plan-feature-icon">{premium ? CHECK_ICON : CROSS_ICON}</span>
            {feature}
          </div>
        ))}
      </div>
      {premium && <button className="plan-cta">Passer à Premium</button>}
    </div>
  );
}

export function PlansOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`plans-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Forfaits</h2>
        <div style={{ width: 34 }} />
      </div>

      <p className="edit-section-hint" style={{ marginTop: 10, marginBottom: 4 }}>
        Compare ce qui est inclus dans chaque forfait.
      </p>

      <PlanCard premium={false} />
      <PlanCard premium />
    </div>
  );
}
