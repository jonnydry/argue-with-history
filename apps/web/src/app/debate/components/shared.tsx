"use client";

import { useState } from "react";
import type { SocraticDebateScores, StandardDebateScores } from "@/lib/types";

export interface Passage {
  title: string;
  text_excerpt: string;
}

export interface Turn {
  turn_number: number;
  user_argument: string;
  figure_response: string;
  scores: StandardDebateScores | SocraticDebateScores | null;
  scores_error?: string | null;
  sources_used: string[];
  key_claims?: string[];
  passages?: Passage[];
}

export interface SidebarData {
  currentPrompt: string | null;
  scholarPassages: Passage[];
  tips: string[];
  hasKeyClaims: boolean;
  keyClaims: string[];
  hasAnyHelper: boolean;
  socraticQuestionHistory: Array<{
    exchangeNumber: number;
    prompt: string;
    isCurrent: boolean;
  }>;
  socraticAssumptionText: string | null;
  socraticSelfAwarenessTip: string | null;
  roundTrend: Array<{ turnNumber: number; score: number | null }>;
}

export function toScore(
  val: unknown,
  options: { fallback?: number; min?: number; max?: number } = {}
): number {
  const { fallback = 5, min = 1, max = 10 } = options;
  const n = typeof val === "number" && !Number.isNaN(val) ? Math.round(val) : parseInt(String(val ?? ""), 10);
  const num = !Number.isNaN(n) ? n : fallback;
  return Math.min(max, Math.max(min, num));
}

export function toOptionalScore(val: unknown): number {
  return toScore(val, { fallback: 0, min: 0 });
}

export function totalTurnScore(scores: {
  logic_score?: unknown;
  historical_accuracy_score?: unknown;
  rhetoric_score?: unknown;
  rebuttal_score?: unknown;
  clarity_score?: unknown;
  depth_score?: unknown;
  consistency_score?: unknown;
  self_awareness_score?: unknown;
}): number {
  if (scores.clarity_score !== undefined || scores.depth_score !== undefined) {
    return (
      toScore(scores.clarity_score) +
      toScore(scores.depth_score) +
      toScore(scores.consistency_score) +
      toScore(scores.self_awareness_score)
    );
  }
  return (
    toScore(scores.logic_score) +
    toScore(scores.historical_accuracy_score) +
    toScore(scores.rhetoric_score) +
    toOptionalScore(scores.rebuttal_score)
  );
}

export function isSocraticScores(
  scores: StandardDebateScores | SocraticDebateScores | Record<string, unknown>
): scores is SocraticDebateScores {
  return "clarity_score" in scores || "depth_score" in scores;
}

export function isStandardScores(
  scores: StandardDebateScores | SocraticDebateScores | Record<string, unknown>
): scores is StandardDebateScores {
  return "logic_score" in scores || "historical_accuracy_score" in scores;
}

export type ScoreTone = "high" | "medium" | "low";

export function getScoreTone(score: number, max: number): ScoreTone {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

export function scoreToneTextClass(tone: ScoreTone): string {
  return `score-text-${tone}`;
}

export function scoreToneBarClass(tone: ScoreTone): string {
  return `score-bar-${tone}`;
}

export function modeDisplayName(mode: string): string {
  if (mode === "socratic") return "Socratic";
  return "Debate";
}

export function turnLabel(mode: string, n: number): string {
  const prefix = mode === "socratic" ? "Exchange" : "Round";
  return `${prefix} ${String(n).padStart(2, "0")}`;
}

export function compactText(value: string | null | undefined, maxLength = 180): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function AccessibleDetails({
  children,
  className,
  ...props
}: React.DetailsHTMLAttributes<HTMLDetailsElement>) {
  const [open, setOpen] = useState(false);
  return (
    <details
      {...props}
      className={className}
      open={open}
      onToggle={(e) => {
        const isOpen = e.currentTarget.open;
        setOpen(isOpen);
        props.onToggle?.(e);
      }}
    >
      {children}
    </details>
  );
}

export const MAX_SCORE = 40;

export function deriveSidebarData(opts: {
  turns: Turn[];
  openingStatement: string | null;
  openingKeyClaims: string[] | null;
  openingPassages: Passage[];
  isSocratic: boolean;
  isCompleted: boolean;
}): SidebarData {
  const { turns, openingStatement, openingKeyClaims, openingPassages, isSocratic, isCompleted } = opts;

  const latestTurn = turns[turns.length - 1];

  const scholarPassages = turns.length > 0
    ? turns[turns.length - 1].passages ?? []
    : openingPassages;

  const keyClaims = turns.length > 0
    ? turns[turns.length - 1].key_claims ?? []
    : openingKeyClaims ?? [];
  const hasKeyClaims = keyClaims.length > 0;

  const tips: string[] = [];
  if (latestTurn?.scores && !isCompleted && !isSocratic && isStandardScores(latestTurn.scores)) {
    const s = latestTurn.scores;
    if (toScore(s.historical_accuracy_score) < 6) {
      tips.push("Tip: Quote or paraphrase a passage they used. Check \"View sources used\".");
    }
    if (toOptionalScore(s.rebuttal_score) < 6) {
      tips.push("Tip: Respond directly to a claim they made.");
    }
    if (toScore(s.logic_score) < 6) {
      tips.push("Tip: Make your claim clear, then support it with evidence and reasoning.");
    }
  }

  const hasAnyHelper = scholarPassages.length > 0 || tips.length > 0 || hasKeyClaims;

  const currentPrompt = isSocratic
    ? compactText(
        turns.length > 0
          ? turns[turns.length - 1].figure_response
          : openingStatement,
        220
      )
    : null;

  const socraticQuestionHistory = isSocratic
    ? [
        ...(openingStatement
          ? [{ exchangeNumber: 1, prompt: openingStatement, isCurrent: turns.length === 0 }]
          : []),
        ...turns.map((turn, index) => ({
          exchangeNumber: index + 2,
          prompt: turn.figure_response,
          isCurrent: index === turns.length - 1,
        })),
      ]
    : [];

  const latestSocraticScores =
    latestTurn?.scores && isSocraticScores(latestTurn.scores) ? latestTurn.scores : null;

  const socraticAssumptionText = compactText(
    latestSocraticScores?.self_awareness_reason ??
      latestSocraticScores?.depth_reason ??
      latestSocraticScores?.improvements?.[0] ??
      currentPrompt ??
      "This question is trying to expose the premise your answer depends on most.",
    180
  );

  const socraticSelfAwarenessTip = compactText(
    latestSocraticScores?.improvements?.[0] ??
      latestSocraticScores?.self_awareness_reason ??
      "Try naming the assumption the figure is pressing on before you defend your answer.",
    180
  );

  const roundTrend = turns.map((turn) => {
    if (!turn.scores) return { turnNumber: turn.turn_number, score: null as number | null };
    return { turnNumber: turn.turn_number, score: totalTurnScore(turn.scores) };
  });

  return {
    currentPrompt,
    scholarPassages,
    tips,
    hasKeyClaims,
    keyClaims,
    hasAnyHelper,
    socraticQuestionHistory,
    socraticAssumptionText,
    socraticSelfAwarenessTip,
    roundTrend,
  };
}
