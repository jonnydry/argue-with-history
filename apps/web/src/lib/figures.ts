import type { FigureInfo } from "./types";

export const ERA_CATEGORIES = [
  "All",
  "Classical",
  "Roman Empire",
  "Renaissance / Early Modern",
  "Enlightenment",
  "19th–20th Century",
] as const;

export type EraCategory = (typeof ERA_CATEGORIES)[number];

/**
 * Maps a figure's era string to an era category for filtering.
 */
export function getFigureEraCategory(era: string): EraCategory {
  const e = era.toLowerCase();
  if (e.includes("classical athens") || e.includes("ancient greece") || e.includes("roman republic")) {
    return "Classical";
  }
  if (e.includes("roman empire")) {
    return "Roman Empire";
  }
  if (
    e.includes("renaissance") ||
    e.includes("england (1588") ||
    e.includes("england (1632") ||
    e.includes("france (1596") ||
    e.includes("netherlands") ||
    e.includes("germany (1646")
  ) {
    return "Renaissance / Early Modern";
  }
  if (
    e.includes("scotland") ||
    e.includes("prussia") ||
    e.includes("england (1759") ||
    e.includes("geneva") ||
    e.includes("france (1694") ||
    e.includes("england / america") ||
    e.includes("ireland / england")
  ) {
    return "Enlightenment";
  }
  return "19th–20th Century";
}

/**
 * Filter figures by era category.
 */
export function filterFiguresByEra(figures: FigureInfo[], category: EraCategory): FigureInfo[] {
  if (category === "All") return figures;
  return figures.filter((f) => getFigureEraCategory(f.era) === category);
}
