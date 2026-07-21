// The Apollon mark: a point radiating outward in concentric rings — sound
// diffusion, music in motion. See the Charte Graphique handoff
// (logo-application-streaming-musical/project/Charte Graphique.dc.html).
export function ApollonMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" stroke="oklch(0.65 0.15 75 / 0.5)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" stroke="oklch(0.7 0.15 75 / 0.7)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="oklch(0.78 0.16 75)" />
    </svg>
  );
}

// Icon inside its rounded-square tile, as used in headers/status bars.
export function ApollonMarkTile({ size = 40, markSize = 24 }: { size?: number; markSize?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "var(--ink3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ApollonMark size={markSize} />
    </div>
  );
}

// Icon + wordmark, horizontal lockup — status bar, login screen.
export function ApollonWordmark({ markSize = 22, textSize = 18 }: { markSize?: number; textSize?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <ApollonMark size={markSize} />
      <span className="display" style={{ fontWeight: 700, fontSize: textSize, letterSpacing: "-0.02em" }}>
        Apollon
      </span>
    </span>
  );
}
