"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";

/** Coerce score value to integer and clamp to a safe range. */
function toScore(
  val: unknown,
  options: { fallback?: number; min?: number; max?: number } = {}
): number {
  const { fallback = 5, min = 1, max = 10 } = options;
  const n = typeof val === "number" && !Number.isNaN(val) ? Math.round(val) : parseInt(String(val ?? ""), 10);
  const num = !Number.isNaN(n) ? n : fallback;
  return Math.min(max, Math.max(min, num));
}

function toOptionalScore(val: unknown): number {
  return toScore(val, { fallback: 0, min: 0 });
}

function totalTurnScore(scores: {
  logic_score?: unknown;
  historical_accuracy_score?: unknown;
  rhetoric_score?: unknown;
  rebuttal_score?: unknown;
  // Socratic axes
  clarity_score?: unknown;
  depth_score?: unknown;
  consistency_score?: unknown;
  self_awareness_score?: unknown;
}): number {
  // If socratic axes present, use those
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

function isSocraticScores(
  scores: StandardDebateScores | SocraticDebateScores | Record<string, unknown>
): scores is SocraticDebateScores {
  return "clarity_score" in scores || "depth_score" in scores;
}

function isStandardScores(
  scores: StandardDebateScores | SocraticDebateScores | Record<string, unknown>
): scores is StandardDebateScores {
  return "logic_score" in scores || "historical_accuracy_score" in scores;
}

type ScoreTone = "high" | "medium" | "low";

function getScoreTone(score: number, max: number): ScoreTone {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

function scoreToneTextClass(tone: ScoreTone): string {
  return `score-text-${tone}`;
}

function scoreToneBarClass(tone: ScoreTone): string {
  return `score-bar-${tone}`;
}

function AccessibleDetails({
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
      aria-expanded={open}
    >
      {children}
    </details>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SocraticDebateScores, StandardDebateScores } from "@/lib/types";
import { useDebateStore } from "@/stores/debate-store";

// ── Mode display helper ───────────────────────────────────────────────────────
function modeDisplayName(mode: string): string {
  if (mode === "socratic") return "Socratic";
  return "Debate";
}

// ── Turn/Exchange label ───────────────────────────────────────────────────────
function turnLabel(mode: string, n: number): string {
  const prefix = mode === "socratic" ? "Exchange" : "Round";
  return `${prefix} ${String(n).padStart(2, "0")}`;
}

export default function DebatePageContent() {
  const selectedFigure = useDebateStore((s) => s.selectedFigure);
  const selectedTopic = useDebateStore((s) => s.selectedTopic);
  const currentDebateId = useDebateStore((s) => s.currentDebateId);
  const currentDebate = useDebateStore((s) => s.currentDebate);
  const openingStatement = useDebateStore((s) => s.openingStatement);
  const openingKeyClaims = useDebateStore((s) => s.openingKeyClaims);
  const openingPassages = useDebateStore((s) => s.openingPassages);
  const isLoading = useDebateStore((s) => s.isLoading);
  const error = useDebateStore((s) => s.error);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
  const prefetchTopicPrimer = useDebateStore((s) => s.prefetchTopicPrimer);
  const hydrateSelectionsFromDebate = useDebateStore((s) => s.hydrateSelectionsFromDebate);
  const restoreDebateIfNeeded = useDebateStore((s) => s.restoreDebateIfNeeded);
  const structuredInput = useDebateStore((s) => s.structuredInput);
  const setStructuredInput = useDebateStore((s) => s.setStructuredInput);
  const scholarMode = useDebateStore((s) => s.scholarMode);
  const debateMode = useDebateStore((s) => s.debateMode);
  const startDebate = useDebateStore((s) => s.startDebate);
  const submitArgument = useDebateStore((s) => s.submitArgument);
  const endDebate = useDebateStore((s) => s.endDebate);
  const reset = useDebateStore((s) => s.reset);
  const clearForNewTopic = useDebateStore((s) => s.clearForNewTopic);
  const clearStaleDebateIfMismatch = useDebateStore((s) => s.clearStaleDebateIfMismatch);
  const router = useRouter();
  const learningSummary = useDebateStore((s) => s.learningSummary);
  const topicPrimer = useDebateStore((s) => s.topicPrimer);
  const topicPrimerKey = useDebateStore((s) => s.topicPrimerKey);

  const [argument, setArgument] = useState("");
  const transcriptContentRef = useRef<HTMLDivElement>(null);
  const transcriptViewportRef = useRef<HTMLDivElement | null>(null);
  const isPinnedToBottomRef = useRef(true);
  const previousTurnCountRef = useRef(0);
  const previousLatestTurnScoredRef = useRef(false);
  const SCROLL_PIN_THRESHOLD_PX = 40;
  const activeDebateId = currentDebate?.id ?? currentDebateId ?? null;
  const turnCount = currentDebate?.turns.length ?? 0;
  const latestTurnHasScore = Boolean(currentDebate?.turns[turnCount - 1]?.scores);

  const scrollTranscriptToBottom = (behavior: ScrollBehavior = "auto") => {
    const viewport = transcriptViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
  };

  const effectivePrimer =
    topicPrimer && topicPrimerKey && selectedFigure && selectedTopic && topicPrimerKey === `${selectedFigure.id}:${selectedTopic.id}`
      ? topicPrimer
      : null;

  useEffect(() => {
    void restoreDebateIfNeeded();
  }, [restoreDebateIfNeeded]);

  useEffect(() => {
    clearStaleDebateIfMismatch();
  }, [currentDebate, selectedFigure?.id, selectedTopic?.id, clearStaleDebateIfMismatch]);

  useEffect(() => {
    if (!currentDebate || (selectedFigure && selectedTopic)) return;
    let cancelled = false;
    const restoreSelections = async () => {
      await fetchFigures();
      if (!cancelled) hydrateSelectionsFromDebate();
    };
    void restoreSelections();
    return () => {
      cancelled = true;
    };
  }, [currentDebate, selectedFigure, selectedTopic, fetchFigures, hydrateSelectionsFromDebate]);

  useEffect(() => {
    if (selectedFigure && selectedTopic && !currentDebate) {
      void prefetchTopicPrimer();
    }
  }, [selectedFigure, selectedTopic, currentDebate, prefetchTopicPrimer]);

  useEffect(() => {
    const viewport = transcriptContentRef.current?.parentElement;
    if (!viewport) return;

    transcriptViewportRef.current = viewport as HTMLDivElement;

    const updatePinnedState = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      isPinnedToBottomRef.current = distanceFromBottom <= SCROLL_PIN_THRESHOLD_PX;
    };

    updatePinnedState();
    viewport.addEventListener("scroll", updatePinnedState);
    return () => {
      viewport.removeEventListener("scroll", updatePinnedState);
    };
  }, [activeDebateId, SCROLL_PIN_THRESHOLD_PX]);

  useEffect(() => {
    if (!activeDebateId) return;

    const appendedTurn = turnCount > previousTurnCountRef.current;
    const scoreJustArrived =
      turnCount === previousTurnCountRef.current &&
      latestTurnHasScore &&
      !previousLatestTurnScoredRef.current;

    if (isPinnedToBottomRef.current) {
      scrollTranscriptToBottom(appendedTurn || scoreJustArrived ? "smooth" : "auto");
    }

    previousTurnCountRef.current = turnCount;
    previousLatestTurnScoredRef.current = latestTurnHasScore;
  }, [activeDebateId, turnCount, latestTurnHasScore, openingStatement]);

  const handleStartDebate = async () => {
    await startDebate();
  };

  const handleSubmitArgument = async () => {
    if (!argument.trim()) return;
    await submitArgument(argument.trim());
    setArgument("");
  };

  const handleEndDebate = async () => {
    await endDebate();
  };

  const handleNewDebate = () => {
    reset();
    setArgument("");
  };

  const handleSameOpponentNewTopic = () => {
    clearForNewTopic();
    setArgument("");
    router.push("/figures");
  };

  // ── No figure/topic selected ──────────────────────────────────────────────
  if ((currentDebate || currentDebateId) && (!selectedFigure || !selectedTopic)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center noise-bg px-4">
        <Card className="max-w-md w-full arena-panel">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">RESTORING DEBATE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Restoring your saved figure and topic selections...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedFigure || !selectedTopic) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center noise-bg px-4">
        <div className="max-w-md w-full text-center arena-enter">
          <Swords size={40} className="mx-auto mb-6 text-muted-foreground/30" />
          <h2 className="editorial-display text-3xl sm:text-4xl mb-3">NO OPPONENT<br/><span className="headline-emphasis">SELECTED</span></h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Choose a figure and topic to enter the arena.
          </p>
          <Link href="/figures">
            <Button className="w-full text-base py-5 h-auto bg-foreground text-background btn-press font-bold tracking-wider">
              <Swords size={18} className="mr-2" />
              SELECT OPPONENT
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Pre-debate / READY screen ─────────────────────────────────────────────
  if (!currentDebate) {
    return (
      <div className="min-h-screen bg-background text-foreground noise-bg">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Swords size={20} strokeWidth={1.5} className="shrink-0" />
              <Link href="/" className="text-lg sm:text-2xl font-bold tracking-tight hover:underline underline-offset-4">
                ARGUE WITH HISTORY
              </Link>
            </div>
            <Link href="/figures" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4">
              ← FIGURES
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
          <div className="max-w-xl mx-auto arena-enter">
            <p className="war-label mb-4">ENTERING THE ARENA</p>
            {/* Figure name in editorial serif, last word italicised */}
            <h2 className="editorial-display text-5xl sm:text-7xl md:text-8xl mb-4">
              {selectedFigure.name.split(' ').map((word, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1 ? (
                    <span className="headline-emphasis">{word.toUpperCase()}</span>
                  ) : (
                    <>{word.toUpperCase()} </>
                  )}
                </span>
              ))}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 sm:mb-12">
              {selectedFigure.era} · {selectedFigure.traits?.slice(0, 3).join(' · ')}
            </p>

            <div className="arena-divider mb-6">
              <Swords size={14} className="text-muted-foreground/40" />
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <p className="war-label mb-2">TOPIC OF CONTENTION</p>
                <p className="editorial-section-title text-xl sm:text-2xl">{selectedTopic.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="war-label">MODE</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.12em] border ${
                    debateMode === "socratic"
                      ? "text-accent border-accent/40 bg-accent/10"
                      : "text-muted-foreground border-border/60 bg-secondary/40"
                  }`}
                >
                  {modeDisplayName(debateMode)}
                </span>
              </div>
            </div>

            {effectivePrimer && (
              <div className="border border-border p-4 sm:p-6 mb-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] font-bold">Position Primer</p>
                {effectivePrimer.position_summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{effectivePrimer.position_summary}</p>
                )}
                {effectivePrimer.sample_quote && (
                  <blockquote className="text-sm border-l-2 border-foreground/30 pl-3 italic text-muted-foreground">
                    &ldquo;{effectivePrimer.sample_quote}&rdquo;
                  </blockquote>
                )}
                {effectivePrimer.user_task && (
                  <p className="text-xs text-muted-foreground">{effectivePrimer.user_task}</p>
                )}
              </div>
            )}

            <div className="arena-divider mb-6">
              <Swords size={14} className="text-muted-foreground/40" />
            </div>

            <Button
              onClick={handleStartDebate}
              disabled={isLoading}
              className="w-full text-lg sm:text-xl py-7 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press font-bold tracking-wider"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  PREPARING ARENA...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Swords size={20} />
                  ENTER THE ARENA
                </span>
              )}
            </Button>
            {error && <p className="text-destructive text-sm mt-3">{error}</p>}
          </div>
        </main>
      </div>
    );
  }

  // ── Active debate ─────────────────────────────────────────────────────────
  const isCompleted = currentDebate.status === "completed";
  const isDebateMode = currentDebate.mode === "debate";
  const isSocratic = currentDebate.mode === "socratic";
  const isFixedTurns = isDebateMode && currentDebate.max_turns > 0;
  const isUnlimitedDebate = isDebateMode && currentDebate.max_turns === 0;

  const latestTurn = currentDebate.turns[currentDebate.turns.length - 1];
  const maxScore = 40;
  const latestTurnScore = latestTurn?.scores
    ? totalTurnScore(latestTurn.scores)
    : 0;
  const scoredTurnTotals = currentDebate.turns
    .filter((turn) => Boolean(turn.scores))
    .map((turn) => totalTurnScore(turn.scores!));
  const aggregateScore =
    scoredTurnTotals.length > 0
      ? Math.round(scoredTurnTotals.reduce((sum, n) => sum + n, 0) / scoredTurnTotals.length)
      : latestTurnScore;

  // ── Outcome label: Socratic vs standard ──────────────────────────────────
  const socraticOutcomeLabel =
    aggregateScore >= 30 ? "DIALECTICIAN" : aggregateScore >= 20 ? "INTERLOCUTOR" : "NOVICE";
  const standardOutcomeLabel =
    aggregateScore >= 30 ? "VICTORY" : aggregateScore >= 20 ? "WELL FOUGHT" : "DEFEATED";
  const outcomeLabel = isSocratic ? socraticOutcomeLabel : standardOutcomeLabel;
  const outcomeToneClass = scoreToneTextClass(getScoreTone(aggregateScore, maxScore));

  const roundTrend = currentDebate.turns.map((turn) => {
    if (!turn.scores) {
      return { turnNumber: turn.turn_number, score: null as number | null };
    }
    const score = totalTurnScore(turn.scores);
    return { turnNumber: turn.turn_number, score };
  });

  const scholarPassages = scholarMode
    ? (currentDebate.turns.length > 0
        ? currentDebate.turns[currentDebate.turns.length - 1].passages ?? []
        : openingPassages)
    : [];

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

  const keyClaims = currentDebate.turns.length > 0
    ? currentDebate.turns[currentDebate.turns.length - 1].key_claims
    : openingKeyClaims;
  const hasKeyClaims = keyClaims && keyClaims.length > 0 && selectedFigure;
  const hasAnyHelper = scholarPassages.length > 0 || tips.length > 0 || hasKeyClaims;
  const latestScoredTurn = [...currentDebate.turns].reverse().find((turn) => Boolean(turn.scores));
  const latestScoredTurnTotal = latestScoredTurn?.scores
    ? totalTurnScore(latestScoredTurn.scores)
    : null;
  const latestScoreToneClass =
    latestScoredTurnTotal !== null
      ? scoreToneTextClass(getScoreTone(latestScoredTurnTotal, maxScore))
      : "";

  // ── Score cell renderer ───────────────────────────────────────────────────
  const renderScoreCell = (label: string, score: number, reason?: string) => {
    const tone = getScoreTone(score, 10);
    return (
      <div className="p-3 sm:p-4" title={reason || undefined}>
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none mb-2 ${scoreToneTextClass(tone)}`}>
          {score}<span className="text-sm font-normal text-muted-foreground">/10</span>
        </p>
        <div className="debate-score-bar-track">
          <div
            className={`debate-score-bar-fill ${scoreToneBarClass(tone)}`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    );
  };

  // ── Inline scorecard renderer (per turn) ─────────────────────────────────
  const renderInlineScorecard = (
    turn: typeof currentDebate.turns[0],
    isLatestTurn: boolean
  ) => {
    if (turn.scores_error) {
      return (
        <p className="text-muted-foreground text-sm mt-4">{turn.scores_error}</p>
      );
    }
    if (!turn.scores) return null;

    const scores = turn.scores;
    const useSocratic = isSocratic && isSocraticScores(scores);

    const scorecardTitle = isSocratic ? "Reflection" : "Scorecard";

    let cells: React.ReactNode;
    let turnTotal: number;

    if (useSocratic) {
      const clarity = toScore(scores.clarity_score);
      const depth = toScore(scores.depth_score);
      const consistency = toScore(scores.consistency_score);
      const selfAwareness = toScore(scores.self_awareness_score);
      turnTotal = clarity + depth + consistency + selfAwareness;
      cells = (
        <div className="debate-score-grid border border-border/30">
          {renderScoreCell("Clarity", clarity, scores.clarity_reason as string | undefined)}
          {renderScoreCell("Depth", depth, scores.depth_reason as string | undefined)}
          {renderScoreCell("Consistency", consistency, scores.consistency_reason as string | undefined)}
          {renderScoreCell("Self-Awareness", selfAwareness, scores.self_awareness_reason as string | undefined)}
        </div>
      );
    } else {
      const standardScores = isStandardScores(scores) ? scores : null;
      const logic = toScore(standardScores?.logic_score);
      const historical = toScore(standardScores?.historical_accuracy_score);
      const rhetoric = toScore(standardScores?.rhetoric_score);
      const rebuttal = toOptionalScore(standardScores?.rebuttal_score);
      turnTotal = logic + historical + rhetoric + rebuttal;
      cells = (
        <div className="debate-score-grid border border-border/30">
          {renderScoreCell("Logic", logic, standardScores?.logic_reason || undefined)}
          {renderScoreCell("Historical", historical, standardScores?.historical_reason || undefined)}
          {renderScoreCell("Rhetoric", rhetoric, standardScores?.rhetoric_reason || undefined)}
          {renderScoreCell("Rebuttal", rebuttal, standardScores?.rebuttal_reason || undefined)}
        </div>
      );
    }

    const turnClaimChecks = "claim_checks" in scores
      ? (scores as { claim_checks?: Array<{ type: string; note: string }> }).claim_checks
      : undefined;
    const hasTurnClaims = Array.isArray(turnClaimChecks) && turnClaimChecks.length > 0;
    const hasDetails =
      ((turn.scores as { strengths?: string[] }).strengths?.length ?? 0) > 0 ||
      ((turn.scores as { improvements?: string[] }).improvements?.length ?? 0) > 0 ||
      hasTurnClaims;

    const scorecardDetails = (
      <>
        {cells}

        <div className="border border-border/30 border-t-0 px-4 py-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
          <span className="text-2xl font-bold tabular-nums">
            {turnTotal}<span className="text-sm font-normal text-muted-foreground">/{maxScore}</span>
          </span>
        </div>

        {hasDetails && (
          <div className="mt-3 space-y-2">
            {((turn.scores as { strengths?: string[] }).strengths?.length ?? 0) > 0 && (
              <AccessibleDetails className="group/strengths">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-foreground/85 list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/strengths:rotate-90 transition-transform inline-block">▶</span>
                  Strengths ({(turn.scores as { strengths: string[] }).strengths.length})
                </summary>
                <div className="mt-1 p-3 bg-secondary/30 border border-border/50 border-l-2 border-l-accent/60 space-y-1">
                  {(turn.scores as { strengths: string[] }).strengths.map((s: string, i: number) => (
                    <p key={i} className="text-sm text-foreground/90">+ {s}</p>
                  ))}
                </div>
              </AccessibleDetails>
            )}
            {((turn.scores as { improvements?: string[] }).improvements?.length ?? 0) > 0 && (
              <AccessibleDetails className="group/improvements">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/improvements:rotate-90 transition-transform inline-block">▶</span>
                  Improvements ({(turn.scores as { improvements: string[] }).improvements.length})
                </summary>
                <div className="mt-1 p-3 bg-secondary/20 border border-border/50 border-l-2 border-l-foreground/40 space-y-1">
                  {(turn.scores as { improvements: string[] }).improvements.map((s: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">~ {s}</p>
                  ))}
                </div>
              </AccessibleDetails>
            )}
            {hasTurnClaims && (
              <AccessibleDetails className="group/claims">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-foreground/75 list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/claims:rotate-90 transition-transform inline-block">▶</span>
                  Claim Check ({turnClaimChecks!.length})
                </summary>
                <div className="mt-1 p-3 bg-secondary/20 border border-border/50 border-l-2 border-l-foreground/30 space-y-1">
                  {turnClaimChecks!.map((c, i) => (
                    <p
                      key={i}
                      className={`text-sm ${
                        c.type === "accurate" ? "text-foreground"
                        : c.type === "mischaracterized" ? "text-foreground/85"
                        : "text-muted-foreground"
                      }`}
                    >
                      {c.type === "accurate" ? "✓ " : c.type === "mischaracterized" ? "~ " : "· "}
                      {c.note}
                    </p>
                  ))}
                </div>
              </AccessibleDetails>
            )}
          </div>
        )}
      </>
    );

    if (!isLatestTurn) {
      return (
        <AccessibleDetails className="mt-4 group/turnscore">
          <summary className="cursor-pointer list-none arena-panel px-4 py-3 flex items-center gap-2">
            <span className="group-open/turnscore:rotate-90 transition-transform inline-block text-muted-foreground">▶</span>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-foreground/80">{scorecardTitle}</span>
            <span className="ml-auto text-sm tabular-nums font-semibold">
              {turnTotal}<span className="text-xs font-normal text-muted-foreground">/{maxScore}</span>
            </span>
          </summary>
          <div className="mt-3">{scorecardDetails}</div>
        </AccessibleDetails>
      );
    }

    return (
      <div className="mt-6">
        <div className="debate-scorecard-divider">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">{scorecardTitle}</span>
        </div>
        {scorecardDetails}
      </div>
    );
  };

  // ── Sidebar: key claims + scholar sources ─────────────────────────────────
  const renderSidebar = () => {
    if (!hasAnyHelper) return null;
    return (
      <aside className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 shrink-0">
        {hasKeyClaims && (
          <div className="arena-panel p-4 space-y-2">
            <p className="war-label">{selectedFigure!.name.toUpperCase()} ARGUES</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5 pl-1">
              {keyClaims!.map((c, i) => (
                <li key={i} className="leading-relaxed">{c}</li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground italic">How do you respond to these points?</p>
          </div>
        )}
        {scholarPassages.length > 0 && (
          <div className="arena-panel p-4 space-y-2">
            <p className="war-label">SOURCES TO ENGAGE WITH</p>
            <p className="text-xs text-muted-foreground">Review these passages before responding.</p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {scholarPassages.map((p, i) => (
                <div key={i} className="pl-3 border-l-2 border-border">
                  <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {tips.length > 0 && (
          <div className="p-3 bg-secondary/25 border border-border/50 border-l-2 border-l-accent/60">
            {tips.map((t, i) => (
              <p key={i} className="text-sm text-foreground/85">• {t}</p>
            ))}
          </div>
        )}
      </aside>
    );
  };

  // ── Mobile helper sections ────────────────────────────────────────────────
  const renderMobileHelpers = () => {
    if (!hasAnyHelper) return null;
    return (
      <div className="lg:hidden">
        <AccessibleDetails className="group/helpers">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
            <span className="group-open/helpers:rotate-90 transition-transform inline-block">▶</span>
            Debate aids
            {tips.length > 0 && (
              <Badge variant="outline" className="text-xs ml-1 py-0 border-foreground/30 text-foreground/80">Tips</Badge>
            )}
          </summary>
          <div className="mt-3 space-y-3">
            {scholarPassages.length > 0 && (
              <div className="mb-4 p-4 border border-border">
                <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">Sources to Engage With</p>
                <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {scholarPassages.map((p, i) => (
                    <div key={i} className="pl-3 border-l-2 border-border">
                      <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tips.length > 0 && (
              <div className="mb-4 p-3 bg-secondary/25 border border-border/50 border-l-2 border-l-accent/60">
                {tips.map((t, i) => (
                  <p key={i} className="text-sm text-foreground/85">• {t}</p>
                ))}
              </div>
            )}
            {hasKeyClaims && (
              <div className="p-4 border-l-4 border-accent/50 bg-secondary/20 mb-4">
                <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">
                  {selectedFigure!.name} argues
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5 pl-1">
                  {keyClaims!.map((c, i) => (
                    <li key={i} className="leading-relaxed">{c}</li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground mt-3 italic">How do you respond to these points?</p>
              </div>
            )}
          </div>
        </AccessibleDetails>
      </div>
    );
  };

  // ── Learning summary ──────────────────────────────────────────────────────
  const renderLearningSummaryContent = () => (
    <>
      {learningSummary!.summary && (
        <p className="text-sm leading-relaxed">{learningSummary!.summary}</p>
      )}
      {(learningSummary as { key_takeaway?: string }).key_takeaway && (
        <div className="mt-3 p-3 border border-foreground/20">
          <p className="text-xs uppercase tracking-[0.15em] font-bold mb-1">Key Takeaway</p>
          <p className="text-sm">{(learningSummary as { key_takeaway: string }).key_takeaway}</p>
        </div>
      )}
      {learningSummary!.suggested_readings && learningSummary!.suggested_readings.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.15em] font-bold mb-2">Continue Learning</p>
          <ul className="text-sm space-y-1">
            {learningSummary!.suggested_readings.map((r, i) => {
              const rec = r as { title: string; reason: string; source_id?: string };
              return (
                <li key={i} className="opacity-80">
                  • {rec.source_id ? `[${rec.source_id}] ` : ""}
                  {rec.title}: {rec.reason}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );

  // ── Mode pill helper ─────────────────────────────────────────────────────
  const modePill = (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.12em] border ${
        currentDebate.mode === "socratic"
          ? "text-accent border-accent/40 bg-accent/10"
          : "text-muted-foreground border-border/60 bg-secondary/40"
      }`}
    >
      {modeDisplayName(currentDebate.mode)}
    </span>
  );

  // ── Submit button label ───────────────────────────────────────────────────
  const submitLabel = isSocratic ? "RESPOND" : "STRIKE";
  const submitLoadingLabel = "JUDGING...";

  // ── Textarea placeholder ──────────────────────────────────────────────────
  const textareaPlaceholder = isSocratic
    ? "Respond to the question..."
    : structuredInput
      ? "Claim: [Your main thesis]\nEvidence: [Cite or paraphrase a passage]\nWarrant: [Why this supports your claim]"
      : "Present your argument...";

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">

      {/* Header */}
      <header className="border-b border-border sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Swords size={20} strokeWidth={1.5} className="shrink-0" />
            <Link href="/" className="text-base sm:text-xl font-bold tracking-tight hover:underline underline-offset-4 whitespace-nowrap">
              ARGUE WITH HISTORY
            </Link>
            {/* Desktop: figure / topic then mode pill */}
            <span className="hidden sm:block text-muted-foreground">·</span>
            <span className="hidden sm:block text-sm text-muted-foreground truncate">
              {selectedFigure.name} / {currentDebate.topic}
            </span>
            <span className="hidden sm:inline-flex">{modePill}</span>
            {/* Mobile: mode pill only */}
            <span className="sm:hidden">{modePill}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Turn counter */}
            {isFixedTurns ? (
              <span className="text-xs sm:text-sm font-bold tabular-nums text-muted-foreground">
                {currentDebate.current_turn}/{currentDebate.max_turns}
              </span>
            ) : currentDebate.current_turn > 0 ? (
              <span className="text-xs sm:text-sm font-bold tabular-nums text-muted-foreground">
                {isSocratic ? "Exchange" : "Turn"} {currentDebate.current_turn}
              </span>
            ) : null}

            {/* End button — primary for open-ended debate, outline for fixed debates and Socratic */}
            {!isCompleted && (
              isUnlimitedDebate ? (
                <Button
                  size="sm"
                  onClick={handleEndDebate}
                  className="btn-press bg-foreground text-background hover:bg-foreground/90 font-bold text-xs sm:text-sm"
                >
                  END DEBATE
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndDebate}
                  className="btn-press border-foreground/30 text-xs sm:text-sm"
                >
                  END
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ── Completed / Results screen ──────────────────────────────────── */}
        {isCompleted ? (
          <div className="max-w-3xl mx-auto">
            <div className="arena-panel p-8 sm:p-12 text-center arena-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "4rem" }}>
              <Swords size={28} className="mb-3 text-foreground/25" />
              <p className="war-label mb-2">{isSocratic ? "REFLECTION" : "RESULT"}</p>
              <p className={`war-label mb-4 ${outcomeToneClass}`}>
                {outcomeLabel}
              </p>
              <p className={`text-7xl sm:text-9xl font-bold tracking-tighter tabular-nums leading-none mb-1 score-reveal ${outcomeToneClass}`}>
                {aggregateScore}
              </p>
              <p className="text-sm text-muted-foreground mb-8 uppercase tracking-[0.15em]">of {maxScore} possible</p>

              {roundTrend.length > 0 && (
                <div className="max-w-lg w-full mb-8 text-left arena-panel px-4 py-4 sm:px-5">
                  <p className="text-xs uppercase tracking-[0.15em] font-bold mb-3 text-foreground/80">
                    {isSocratic ? "Exchange Trend" : "Round Trend"}
                  </p>
                  <div className="space-y-2">
                    {roundTrend.map((entry) => (
                      <div key={entry.turnNumber} className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.15em] w-16 text-muted-foreground">
                          {isSocratic ? "Ex" : "R"}{String(entry.turnNumber).padStart(2, "0")}
                        </span>
                        <div className="flex-1 h-2 bg-foreground/10 overflow-hidden">
                          {entry.score !== null && (
                            <div
                              className={`h-full ${scoreToneBarClass(getScoreTone(entry.score, maxScore))}`}
                              style={{ width: `${(entry.score / maxScore) * 100}%` }}
                            />
                          )}
                        </div>
                        <span className="text-xs tabular-nums w-12 text-right text-muted-foreground">
                          {entry.score !== null ? `${entry.score}/${maxScore}` : "--"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {learningSummary && (learningSummary.summary || (learningSummary as { key_takeaway?: string }).key_takeaway) && (
                <div className="text-left max-w-lg w-full mb-8 arena-panel px-4 py-4 sm:px-5">
                  <AccessibleDetails className="sm:hidden group/learn">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] font-bold text-foreground list-none flex items-center gap-1.5 mb-2">
                      <span className="group-open/learn:rotate-90 transition-transform inline-block">▶</span>
                      Learning Summary
                    </summary>
                    <div className="mt-2 text-foreground">{renderLearningSummaryContent()}</div>
                  </AccessibleDetails>
                  <div className="hidden sm:block text-foreground">
                    <p className="text-xs uppercase tracking-[0.15em] font-bold mb-3 text-foreground">Learning Summary</p>
                    {renderLearningSummaryContent()}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/figures">
                  <Button
                    onClick={handleNewDebate}
                    className="bg-foreground text-background hover:bg-foreground/90 btn-press font-bold"
                  >
                    CHOOSE NEW OPPONENT →
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSameOpponentNewTopic}
                  className="border-foreground/30 text-foreground hover:bg-secondary/40 btn-press"
                  title="Same opponent, different topic"
                >
                  SAME OPPONENT, NEW TOPIC
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // ── Active debate: two-column layout ──────────────────────────────
          <div className="flex gap-8 items-start max-w-6xl mx-auto">

            {/* Left: transcript + input */}
            <div className="flex-1 min-w-0">
              {/* Scroll area for transcript */}
              <ScrollArea className="h-[50vh] sm:h-[60vh] mb-6">
                <div ref={transcriptContentRef} className="space-y-0 pr-2">

                  {/* Opening statement (figure opens first in both modes) */}
                  {currentDebate.turns.length === 0 && openingStatement && (
                    <div className="mb-6">
                      <div className="debate-round-divider">
                        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">
                          {isSocratic ? "Opening Question" : "Opening Statement"}
                        </span>
                      </div>

                      <div className="debate-figure-block p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs uppercase tracking-[0.2em] font-bold">
                            {selectedFigure.name.toUpperCase()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-background">
                          {openingStatement}
                        </p>
                        {openingPassages.length > 0 && (
                          <AccessibleDetails className="mt-4 group">
                            <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-background/60 hover:text-background list-none flex items-center gap-1.5">
                              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                              View sources used
                            </summary>
                            <div className="mt-2 space-y-2 pl-3 border-l-2 border-background/20">
                              {openingPassages.map((p, i) => (
                                <div key={i}>
                                  <p className="text-xs font-medium text-background/70">{p.title}</p>
                                  <p className="text-sm text-background/60 mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                                </div>
                              ))}
                            </div>
                          </AccessibleDetails>
                        )}
                      </div>

                      <div className="mt-6 text-center">
                        <div className="arena-divider">
                          <Swords size={12} className="text-muted-foreground/30" />
                        </div>
                        <p className="war-label">
                          {isSocratic ? "Respond to the question" : "Your turn to respond"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Empty state fallback when no opening statement is available */}
                  {currentDebate.turns.length === 0 && !openingStatement && (
                    <div className="py-20 text-center arena-enter">
                      <Swords size={32} className="mx-auto mb-4 text-muted-foreground/40" />
                      <p className="editorial-display text-4xl sm:text-5xl mb-3">THE ARENA<br/><span className="headline-emphasis">AWAITS</span></p>
                      <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Present your opening argument below.</p>
                    </div>
                  )}

                  {/* Turns */}
                  {currentDebate.turns.map((turn) => {
                    const isLatestTurn = turn.turn_number === latestTurn?.turn_number;
                    return (
                    <div key={turn.turn_number}>
                      {/* Round/Exchange divider */}
                      <div className="debate-round-divider">
                        <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">
                          {turnLabel(currentDebate.mode, turn.turn_number)}
                        </span>
                      </div>

                      {/* Your argument */}
                      <div className="debate-you-block mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs border-foreground/30">YOU</Badge>
                        </div>
                        <div className="bg-secondary/40 border border-border/40 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.user_argument}</p>
                        </div>
                      </div>

                      {/* Figure response */}
                      <div className="mb-2">
                        <div className="debate-figure-block p-4 sm:p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs uppercase tracking-[0.2em] font-bold text-background">
                              {selectedFigure.name.toUpperCase()}
                            </span>
                            {turn.sources_used.length > 0 && (
                              <span className="text-xs text-background/50">
                                {turn.sources_used.join(", ")}
                              </span>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-background">
                            {turn.figure_response}
                          </p>
                          {turn.passages && turn.passages.length > 0 && (
                            <AccessibleDetails className="mt-4 group">
                              <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-background/60 hover:text-background list-none flex items-center gap-1.5">
                                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                                View sources used
                              </summary>
                              <div className="mt-2 space-y-2 pl-3 border-l-2 border-background/20">
                                {turn.passages.map((p, i) => (
                                  <div key={i}>
                                    <p className="text-xs font-medium text-background/70">{p.title}</p>
                                    <p className="text-sm text-background/60 mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                                  </div>
                                ))}
                              </div>
                            </AccessibleDetails>
                          )}
                        </div>

                        {/* Inline scorecard */}
                        {renderInlineScorecard(turn, isLatestTurn)}
                      </div>
                    </div>
                  );
                  })}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-3 py-8 text-muted-foreground arena-enter">
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm uppercase tracking-[0.2em] font-bold">
                        {selectedFigure.name.toUpperCase()} is {isSocratic ? "formulating a question" : "formulating a response"}...
                      </span>
                    </div>
                  )}

                </div>
              </ScrollArea>

              {/* ── Input area ─────────────────────────────────────────────── */}
              <div className="space-y-4">
                {latestScoredTurn?.scores && latestScoredTurnTotal !== null && (
                  <div className="arena-panel px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="war-label mb-1">
                        Latest score · {turnLabel(currentDebate.mode, latestScoredTurn.turn_number)}
                      </p>
                      {isSocratic ? (
                        <p className="text-xs sm:text-sm text-foreground/80">
                          {(() => {
                            const s = latestScoredTurn.scores;
                            if (isSocraticScores(s)) {
                              return `Clarity ${toScore(s.clarity_score)} · Depth ${toScore(s.depth_score)} · Consistency ${toScore(s.consistency_score)} · Self-Awareness ${toScore(s.self_awareness_score)}`;
                            }
                            if (isStandardScores(s)) {
                              return `Logic ${toScore(s.logic_score)} · Historical ${toScore(s.historical_accuracy_score)} · Rhetoric ${toScore(s.rhetoric_score)}`;
                            }
                            return "Reflection available";
                          })()}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-foreground/80">
                          {(() => {
                            const s = latestScoredTurn.scores;
                            if (!isStandardScores(s)) return "Score details unavailable";
                            return `Logic ${toScore(s.logic_score)} · Historical ${toScore(s.historical_accuracy_score)} · Rhetoric ${toScore(s.rhetoric_score)} · Rebuttal ${toOptionalScore(s.rebuttal_score)}`;
                          })()}
                        </p>
                      )}
                    </div>
                    <p className={`text-3xl font-bold tabular-nums shrink-0 ${latestScoreToneClass}`}>
                      {latestScoredTurnTotal}
                      <span className="text-xs font-normal text-muted-foreground">/{maxScore}</span>
                    </p>
                  </div>
                )}

                {/* Mobile helpers */}
                {renderMobileHelpers()}

                {/* Argument structure helper — only for non-Socratic */}
                {!isSocratic && (
                  <AccessibleDetails className="group/arghelper">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
                      <span className="group-open/arghelper:rotate-90 transition-transform inline-block">▶</span>
                      Argument structure helper
                    </summary>
                    <div className="mt-2 p-3 bg-secondary/30 border border-border text-sm space-y-1">
                      <p className="text-muted-foreground">
                        Claim: Your main thesis. Evidence: Cite or paraphrase a passage. Warrant: Why this supports your claim.
                      </p>
                      <button
                        type="button"
                        onClick={() => setStructuredInput(!structuredInput)}
                        className="text-xs text-foreground/80 hover:underline underline-offset-2"
                      >
                        {structuredInput ? "Use freeform placeholder" : "Use structured placeholder"}
                      </button>
                    </div>
                  </AccessibleDetails>
                )}

                <div className="relative">
                  <Textarea
                    value={argument}
                    onChange={(e) => setArgument(e.target.value)}
                    placeholder={textareaPlaceholder}
                    className="min-h-32 sm:min-h-40 bg-card border-2 ink-border focus:border-foreground resize-none text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-muted-foreground/40 tabular-nums">
                    {argument.length > 0 ? `${argument.length} chars` : ''}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitArgument}
                    disabled={isLoading || !argument.trim()}
                    className="flex-1 text-sm sm:text-base py-5 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press font-bold tracking-wider"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                        {submitLoadingLabel}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Swords size={16} />
                        {submitLabel}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setArgument("")}
                    disabled={isLoading}
                    className="btn-press border-foreground/30"
                  >
                    CLEAR
                  </Button>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
            </div>

            {/* Right: sidebar (desktop only) */}
            {renderSidebar()}
          </div>
        )}
      </main>
    </div>
  );
}
