"use client";

import { useEffect, useRef, useState } from "react";
import { useQuestsStore } from "@/store/quests-store";
import { buildGalaxy } from "@/lib/constellations";
import type { ConstellationStar } from "@/lib/constellations";

// Fixed (non-random) background star positions so server/client render match
// — a client component can still be SSR'd on first paint, and Math.random()
// there would cause a hydration mismatch.
const BG_STARS: [number, number, number][] = [
  [8, 6, 1.2],
  [22, 18, 0.8],
  [40, 4, 1],
  [61, 22, 0.9],
  [78, 9, 1.3],
  [93, 20, 0.8],
  [12, 40, 0.9],
  [33, 55, 1.1],
  [50, 42, 0.8],
  [70, 58, 1],
  [88, 45, 0.9],
  [5, 75, 1],
  [25, 88, 0.8],
  [48, 78, 1.2],
  [66, 92, 0.9],
  [85, 80, 1],
  [96, 95, 0.8],
];

// Per-star wander amplitude/speed/phase, derived deterministically from the
// constellation index + star index (no Math.random — this renders during
// SSR too, and random values there would mismatch the client's first paint).
// Each star gets a visibly different orbit so the shape genuinely deforms
// instead of just sliding as one rigid block.
function wanderParams(ci: number, i: number) {
  const ampX = 6 + ((ci * 7 + i * 3) % 5) * 1.8; // ~6 – 13.2 svg units
  const ampY = 5 + ((ci * 5 + i * 11) % 4) * 1.6; // ~5 – 9.8 svg units
  const freqX = 0.11 + ((ci + i * 2) % 5) * 0.035; // rad/s
  const freqY = 0.09 + ((ci * 3 + i) % 4) * 0.04;
  const phaseX = ci * 1.3 + i * 0.9;
  const phaseY = ci * 0.6 + i * 1.7;
  return { ampX, ampY, freqX, freqY, phaseX, phaseY };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function GalaxyView() {
  const quests = useQuestsStore((s) => s.quests);
  const galaxy = buildGalaxy(quests);
  const [selected, setSelected] = useState<ConstellationStar | null>(null);

  // Kept in sync every render but read only inside the rAF loop below, so
  // the loop always sees fresh star data (e.g. a newly-lit star) without
  // needing to restart — star *positions* are a fixed layout and never
  // change, only color/size do, which React already re-renders normally.
  const galaxyRef = useRef(galaxy);
  galaxyRef.current = galaxy;

  const coreRefs = useRef(new Map<string, SVGCircleElement>());
  const glowRefs = useRef(new Map<string, SVGCircleElement>());
  const lineRefs = useRef(new Map<string, SVGLineElement>());

  // Independent per-star wandering: each star drifts along its own slow
  // orbit (different amplitude/speed/phase), and every connecting line is
  // recomputed from the stars' *current* animated positions each frame —
  // so the constellation's shape genuinely reshapes over time instead of
  // sliding as one rigid block, while lines never detach from their stars.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;
    function tick(now: number) {
      const t = now / 1000;
      galaxyRef.current.constellations.forEach((c, ci) => {
        const live: { x: number; y: number }[] = [];
        c.stars.forEach((s, i) => {
          const { ampX, ampY, freqX, freqY, phaseX, phaseY } = wanderParams(ci, i);
          const x = clamp(s.x + ampX * Math.sin(t * freqX + phaseX), 6, 194);
          const y = clamp(s.y + ampY * Math.cos(t * freqY + phaseY), 6, 134);
          live.push({ x, y });
          const core = coreRefs.current.get(`${c.category}-${i}`);
          if (core) {
            core.setAttribute("cx", String(x));
            core.setAttribute("cy", String(y));
          }
          const glow = glowRefs.current.get(`${c.category}-${i}`);
          if (glow) {
            glow.setAttribute("cx", String(x));
            glow.setAttribute("cy", String(y));
          }
        });
        c.edges.forEach(([a, b], ei) => {
          const pa = live[a];
          const pb = live[b];
          const line = lineRefs.current.get(`${c.category}-${ei}`);
          if (line && pa && pb) {
            line.setAttribute("x1", String(pa.x));
            line.setAttribute("y1", String(pa.y));
            line.setAttribute("x2", String(pb.x));
            line.setAttribute("y2", String(pb.y));
          }
        });
      });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="galaxy-view">
      <svg className="galaxy-bg-stars" viewBox="0 0 100 100" preserveAspectRatio="none">
        {BG_STARS.map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="rgba(255,255,255,0.35)"
            style={{ animationDuration: `${3 + (i % 5) * 0.7}s`, animationDelay: `${-(i * 0.4)}s` }}
          />
        ))}
      </svg>

      <div className="galaxy-header">
        <div className="galaxy-name">{galaxy.name}</div>
        <div className="galaxy-stats">
          {galaxy.completeConstellations}/{galaxy.constellations.length} constellations complètes · {galaxy.litStars}/
          {galaxy.totalStars} étoiles allumées
        </div>
      </div>

      {galaxy.constellations.map((c, ci) => (
        <div key={c.category} className={`constellation-card${c.complete ? " complete" : ""}`}>
          <div className="constellation-title-row">
            <span className="constellation-title">{c.label}</span>
            <span className="constellation-progress">
              {c.litCount}/{c.total}
              {c.complete ? " · complète" : ""}
            </span>
          </div>
          <svg viewBox="0 0 200 140" className="constellation-svg">
            <defs>
              <radialGradient id={`star-glow-${c.category}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={c.color1} stopOpacity="0.85" />
                <stop offset="100%" stopColor={c.color1} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* A gentle whole-constellation sway layers on top of each star's
                own independent wander (driven imperatively in the effect
                above) for extra depth. */}
            <g
              className="constellation-drift"
              style={{ animationDuration: `${11 + ci * 2}s`, animationDelay: `${-(ci * 3.1)}s` }}
            >
              {c.edges.map(([a, b], i) => {
                const sa = c.stars[a];
                const sb = c.stars[b];
                if (!sa || !sb) return null;
                const bothLit = sa.lit && sb.lit;
                return (
                  <line
                    key={i}
                    ref={(el) => {
                      if (el) lineRefs.current.set(`${c.category}-${i}`, el);
                      else lineRefs.current.delete(`${c.category}-${i}`);
                    }}
                    x1={sa.x}
                    y1={sa.y}
                    x2={sb.x}
                    y2={sb.y}
                    stroke={bothLit ? c.color1 : "rgba(255,255,255,0.14)"}
                    strokeWidth={bothLit ? 1.6 : 1}
                    strokeDasharray={bothLit ? undefined : "3 4"}
                  />
                );
              })}
              {c.stars.map((s, i) => (
                <g key={i} onClick={() => setSelected(s)} className="constellation-star-hit">
                  {s.lit && (
                    <circle
                      ref={(el) => {
                        if (el) glowRefs.current.set(`${c.category}-${i}`, el);
                        else glowRefs.current.delete(`${c.category}-${i}`);
                      }}
                      className="star-glow"
                      cx={s.x}
                      cy={s.y}
                      r={15}
                      fill={`url(#star-glow-${c.category})`}
                      style={{ animationDuration: `${2.6 + (i % 4) * 0.5}s`, animationDelay: `${-(i * 0.6)}s` }}
                    />
                  )}
                  <circle
                    ref={(el) => {
                      if (el) coreRefs.current.set(`${c.category}-${i}`, el);
                      else coreRefs.current.delete(`${c.category}-${i}`);
                    }}
                    cx={s.x}
                    cy={s.y}
                    r={s.lit ? 5.5 : 4}
                    fill={s.lit ? c.color1 : "rgba(255,255,255,0.08)"}
                    stroke={s.lit ? c.color2 : "rgba(255,255,255,0.35)"}
                    strokeWidth={1.3}
                  />
                </g>
              ))}
            </g>
          </svg>
        </div>
      ))}

      {selected && (
        <div className="constellation-caption">
          <span className={`cc-mark${selected.lit ? " lit" : ""}`}>{selected.lit ? "★" : "☆"}</span>
          <div>
            <div className="cc-title">{selected.quest.title}</div>
            <div className="cc-status">{selected.lit ? "Débloquée" : "Pas encore débloquée"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
