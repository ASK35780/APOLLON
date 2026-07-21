"use client";

// TODO: replace with the real URLs/handles before shipping — left as
// placeholders since they weren't provided.
const SOCIAL_LINKS = {
  website: "#",
  instagram: "#",
  tiktok: "#",
  facebook: "#",
  github: "#",
};

const EXTERNAL_ICON = (
  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M7 17L17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" strokeLinecap="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff">
      <path d="M16.5 3c.4 2.2 1.8 3.7 4 4v3c-1.5 0-2.9-.4-4-1.2v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.1a2.8 2.8 0 1 0 2 2.7V3h3z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff">
      <path d="M14 21v-8h2.7l.4-3.1H14V8c0-.9.25-1.5 1.55-1.5H17V3.7C16.7 3.66 15.7 3.6 14.5 3.6c-2.4 0-4 1.46-4 4.15V9.9H7.8V13H10.5v8H14z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.21-3.37-1.21-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .28.18.61.69.5A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

const NETWORKS = [
  { label: "Notre site", href: SOCIAL_LINKS.website, icon: <WebsiteIcon />, bg: "linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.65 0.15 75))" },
  {
    label: "Instagram",
    href: SOCIAL_LINKS.instagram,
    icon: <InstagramIcon />,
    bg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
  },
  { label: "TikTok", href: SOCIAL_LINKS.tiktok, icon: <TikTokIcon />, bg: "linear-gradient(135deg, #00F2EA, #010101, #FF0050)" },
  { label: "Facebook", href: SOCIAL_LINKS.facebook, icon: <FacebookIcon />, bg: "#1877F2" },
  { label: "GitHub", href: SOCIAL_LINKS.github, icon: <GitHubIcon />, bg: "#181717" },
];

export function SocialLinksOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`social-view${open ? " open" : ""}`}>
      <div className="profile-top" style={{ position: "static", marginBottom: 4 }}>
        <button aria-label="Retour" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>Nos réseaux</h2>
        <div style={{ width: 34 }} />
      </div>

      <div className="profile-menu" style={{ marginTop: 10 }}>
        {NETWORKS.map((network) => (
          <a key={network.label} href={network.href} target="_blank" rel="noopener noreferrer" className="profile-menu-item">
            <div className="social-icon" style={{ background: network.bg }}>
              {network.icon}
            </div>
            <div className="t">{network.label}</div>
            {EXTERNAL_ICON}
          </a>
        ))}
      </div>
    </div>
  );
}
