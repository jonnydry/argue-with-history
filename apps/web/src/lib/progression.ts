const STORAGE_KEY = "argue-with-history-progression";

export interface ProgressionData {
  byFigure: Record<string, number>;
  byFigureTopic: Record<string, Record<string, boolean>>;
}

function load(): ProgressionData {
  if (typeof window === "undefined") {
    return { byFigure: {}, byFigureTopic: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressionData;
      return {
        byFigure: parsed.byFigure ?? {},
        byFigureTopic: parsed.byFigureTopic ?? {},
      };
    }
  } catch {
    // ignore
  }
  return { byFigure: {}, byFigureTopic: {} };
}

function save(data: ProgressionData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function recordDebateComplete(figureId: string, topicId: string) {
  const data = load();
  data.byFigure[figureId] = (data.byFigure[figureId] ?? 0) + 1;
  if (!data.byFigureTopic[figureId]) data.byFigureTopic[figureId] = {};
  data.byFigureTopic[figureId][topicId] = true;
  save(data);
}

export function getFigureDebateCount(figureId: string): number {
  return load().byFigure[figureId] ?? 0;
}

export function getTopicCompleted(figureId: string, topicId: string): boolean {
  return load().byFigureTopic[figureId]?.[topicId] ?? false;
}

export function getTopicsCompletedForFigure(figureId: string): number {
  const topicMap = load().byFigureTopic[figureId];
  if (!topicMap) return 0;
  return Object.keys(topicMap).length;
}
