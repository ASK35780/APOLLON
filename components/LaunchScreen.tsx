"use client";

import { useEffect, useState } from "react";

// Ported from the Apollon Charte Graphique handoff
// (logo-application-streaming-musical/project/onda-launch-scene.jsx): point
// pulses in, rings ripple outward, icon frame settles, wordmark + tagline
// rise in, then the whole scene fades to reveal the app underneath. Timing
// (delays/durations in seconds) matches the original design 1:1; sizes are
// rescaled from its 1080px reference width down to our ~402px app-shell.
const TOTAL_DURATION_MS = 6000;

export function LaunchScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // globals.css crushes every animation/transition to ~0 under
    // prefers-reduced-motion, which would otherwise leave a frozen splash
    // on screen for the full 6s with nothing visibly happening — skip the
    // wait entirely instead.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setVisible(false), reduced ? 0 : TOTAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="launch-screen" aria-hidden="true">
      <div className="launch-ring launch-ring-1" />
      <div className="launch-ring launch-ring-2" />
      <div className="launch-dot" />
      <div className="launch-frame" />
      <div className="launch-wordmark display">Apollon</div>
      <div className="launch-tagline">La musique, en mouvement.</div>
    </div>
  );
}
