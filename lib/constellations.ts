import type { QuestCategory, QuestWithProgress } from "@/types/database";

// Hand-authored star layouts (viewBox "0 0 200 140"), one per category, sized
// to that category's actual quest count in supabase/migrations/0018_quests_catalog.sql
// (ecoute=5, social=5, decouverte=2, creation=3). If the catalog ever grows a
// category past its layout's point count, extra quests silently fall back to
// a center point (see buildGalaxy) rather than crashing.
const LAYOUTS: Record<
  QuestCategory,
  { label: string; color1: string; color2: string; points: [number, number][]; edges: [number, number][] }
> = {
  ecoute: {
    label: "Écoute",
    color1: "oklch(0.78 0.16 75)",
    color2: "oklch(0.65 0.15 75)",
    points: [
      [15, 95],
      [55, 35],
      [95, 90],
      [135, 30],
      [180, 90],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  social: {
    label: "Social",
    color1: "oklch(0.6 0.14 55)",
    color2: "oklch(0.7 0.13 90)",
    points: [
      [100, 15],
      [165, 60],
      [140, 125],
      [60, 125],
      [35, 60],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  decouverte: {
    label: "Découverte",
    color1: "oklch(0.7 0.13 90)",
    color2: "oklch(0.85 0.1 85)",
    points: [
      [45, 105],
      [155, 35],
    ],
    edges: [[0, 1]],
  },
  creation: {
    label: "Création",
    color1: "oklch(0.85 0.1 85)",
    color2: "oklch(0.6 0.14 55)",
    points: [
      [100, 20],
      [25, 115],
      [175, 115],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
};

export interface ConstellationStar {
  quest: QuestWithProgress;
  x: number;
  y: number;
  lit: boolean;
}

export interface Constellation {
  category: QuestCategory;
  label: string;
  color1: string;
  color2: string;
  stars: ConstellationStar[];
  edges: [number, number][];
  litCount: number;
  total: number;
  complete: boolean;
}

export interface Galaxy {
  constellations: Constellation[];
  totalStars: number;
  litStars: number;
  completeConstellations: number;
  name: string;
}

const CATEGORY_ORDER: QuestCategory[] = ["ecoute", "social", "decouverte", "creation"];

export function buildGalaxy(quests: QuestWithProgress[]): Galaxy {
  const constellations: Constellation[] = CATEGORY_ORDER.map((category) => {
    const layout = LAYOUTS[category];
    const catQuests = quests.filter((q) => q.category === category);
    const stars: ConstellationStar[] = catQuests.map((quest, i) => {
      const point = layout.points[i] ?? layout.points[layout.points.length - 1] ?? [100, 70];
      return { quest, x: point[0], y: point[1], lit: quest.everCompleted };
    });
    const litCount = stars.filter((s) => s.lit).length;
    return {
      category,
      label: layout.label,
      color1: layout.color1,
      color2: layout.color2,
      stars,
      edges: layout.edges,
      litCount,
      total: stars.length,
      complete: stars.length > 0 && litCount === stars.length,
    };
  });

  const totalStars = constellations.reduce((sum, c) => sum + c.total, 0);
  const litStars = constellations.reduce((sum, c) => sum + c.litCount, 0);
  const completeConstellations = constellations.filter((c) => c.complete).length;

  const name =
    completeConstellations === 0
      ? "Nébuleuse naissante"
      : completeConstellations < 3
        ? "Galaxie en formation"
        : completeConstellations < constellations.length
          ? "Galaxie en expansion"
          : "Galaxie Apollon — complète";

  return { constellations, totalStars, litStars, completeConstellations, name };
}
