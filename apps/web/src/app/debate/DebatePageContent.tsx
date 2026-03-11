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

function compactText(value: string | null | undefined, maxLength = 180): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  const maxTurns = useDebateStore((s) => s.maxTurns);
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
    const readyTurnsLabel =
      debateMode === "debate" ? (maxTurns > 0 ? String(maxTurns) : "Open") : "Open";

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
          <div className="max-w-6xl mx-auto arena-enter lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:items-center">
            <div>
              <p className="war-label mb-4">ENTERING THE ARENA</p>
              <h2 className="editorial-display text-5xl sm:text-7xl md:text-8xl mb-4 max-w-4xl">
                {selectedFigure.name.split(" ").map((word, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1 ? (
                      <span className="headline-emphasis">{word.toUpperCase()}</span>
                    ) : (
                      <>{word.toUpperCase()} </>
                    )}
                  </span>
                ))}
              </h2>
              <p className="text-sm text-muted-foreground mb-10 sm:mb-12">
                {selectedFigure.era} · {selectedFigure.traits?.slice(0, 3).join(" · ")}
              </p>

              <div className="arena-divider mb-8">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>

              <div className="mb-10 space-y-6 max-w-2xl">
                <div>
                  <p className="war-label mb-2">TOPIC OF CONTENTION</p>
                  <p className="editorial-section-title text-2xl sm:text-3xl leading-tight">
                    {selectedTopic.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
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

              <Button
                onClick={handleStartDebate}
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[320px] text-lg sm:text-xl py-7 px-10 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press font-bold tracking-wider"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    PREPARING ARENA...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Swords size={20} />
                    ENTER THE ARENA
                  </span>
                )}
              </Button>
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
            </div>

            <aside className="arena-panel mt-10 lg:mt-0 p-6 sm:p-8 space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-foreground/80">
                Position Primer
              </p>
              {effectivePrimer?.position_summary && (
                <p className="text-sm sm:text-base text-muted-foreground leading-8">
                  {effectivePrimer.position_summary}
                </p>
              )}
              {effectivePrimer?.sample_quote && (
                <blockquote className="text-base sm:text-lg border-l-2 border-foreground/30 pl-4 text-foreground/80 leading-8">
                  &ldquo;{effectivePrimer.sample_quote}&rdquo;
                </blockquote>
              )}
              {effectivePrimer?.user_task && (
                <p className="text-sm text-muted-foreground leading-7">{effectivePrimer.user_task}</p>
              )}

              <div className="border-t border-border/80 pt-5 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Turns
                  </p>
                  <p className="text-2xl sm:text-3xl tracking-tight">{readyTurnsLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Mode
                  </p>
                  <p className="text-2xl sm:text-3xl tracking-tight">{modeDisplayName(debateMode)}</p>
                </div>
              </div>
            </aside>
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

  const turnSummaries = currentDebate.turns.map((turn) => ({
    turnNumber: turn.turn_number,
    label: turnLabel(currentDebate.mode, turn.turn_number),
    score: turn.scores ? totalTurnScore(turn.scores) : null,
  }));

  const scholarPassages = scholarMode
    ? (currentDebate.turns.length > 0
        ? currentDebate.turns[currentDebate.turns.length - 1].passages ?? []
        : openingPassages)
    : [];

  const learningSummaryText = learningSummary?.summary ?? null;
  const learningKeyTakeaway = (learningSummary as { key_takeaway?: string } | null)?.key_takeaway ?? null;
  const suggestedReadings = learningSummary?.suggested_readings ?? [];

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

  const currentPrompt = isSocratic
    ? compactText(
        currentDebate.turns.length > 0
          ? currentDebate.turns[currentDebate.turns.length - 1].figure_response
          : openingStatement,
        220
      )
    : null;

  const socraticQuestionHistory = isSocratic
    ? [
        ...(openingStatement
          ? [{ exchangeNumber: 1, prompt: openingStatement, isCurrent: currentDebate.turns.length === 0 }]
          : []),
        ...currentDebate.turns.map((turn, index) => ({
          exchangeNumber: index + 2,
          prompt: turn.figure_response,
          isCurrent: index === currentDebate.turns.length - 1,
        })),
      ]
    : [];

  const scoredSocraticTurns = currentDebate.turns.flatMap((turn) =>
    turn.scores && isSocraticScores(turn.scores) ? [{ turn, scores: turn.scores }] : []
  );

  const socraticAverages = scoredSocraticTurns.length
    ? {
        clarity: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.clarity_score))),
        depth: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.depth_score))),
        consistency: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.consistency_score))),
        selfAwareness: average(
          scoredSocraticTurns.map(({ scores }) => toScore(scores.self_awareness_score))
        ),
      }
    : null;

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

  const socraticDialogueMap = scoredSocraticTurns.map(({ turn, scores }) => ({
    exchangeNumber: turn.turn_number,
    insight: compactText(
      scores.self_awareness_reason ?? scores.improvements?.[0] ?? scores.depth_reason ?? turn.user_argument,
      120
    ) ?? "An underlying assumption came under pressure.",
  }));

  const resultsStatusLabel = isSocratic ? "DIALOGUE COMPLETE" : "COMPLETED";
  const resultsKeyLabel = isSocratic ? "Key Insight" : "Key Takeaway";
  const resultsProgressSubtitle = isSocratic
    ? `of ${maxScore} · avg. across ${currentDebate.turns.length} exchange${currentDebate.turns.length === 1 ? "" : "s"}`
    : `of ${maxScore} possible`;

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
    const strengthsLabel = useSocratic ? "What you examined well" : "Strengths";
    const improvementsLabel = useSocratic ? "Assumptions left unexamined" : "Improvements";
    const selfAwarenessNote = useSocratic
      ? compactText(scores.self_awareness_reason as string | undefined, 180)
      : null;

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
                  {strengthsLabel} ({(turn.scores as { strengths: string[] }).strengths.length})
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
                  {improvementsLabel} ({(turn.scores as { improvements: string[] }).improvements.length})
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
            {selfAwarenessNote && (
              <div className="border-l-2 border-l-accent/70 pl-3 py-1">
                <p className="text-[10px] uppercase tracking-[0.15em] text-accent/90">
                  Self-Awareness Note
                </p>
                <p className="text-sm text-foreground/75 mt-1">{selfAwarenessNote}</p>
              </div>
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

  // ── Sidebar: Paper-inspired right rail ────────────────────────────────────
  const renderSidebar = () => {
    if (isSocratic) {
      return (
        <aside className="hidden lg:flex flex-col gap-5 w-72 xl:w-80 shrink-0 border-l border-border pl-6 pt-2">
          {currentDebate.turns.length === 0 ? (
            <>
              <div className="border border-accent/20 bg-accent/5 px-4 py-4 space-y-3">
                <p className="war-label text-accent">Socratic Dialogue</p>
                <p className="text-sm text-muted-foreground leading-7">
                  {selectedFigure.name} will not argue with you - {" "}
                  they will question you. Each answer exposes an assumption in what you said.
                </p>
              </div>

              {currentPrompt && (
                <div className="pt-5 border-t border-border/80">
                  <p className="war-label mb-3 text-foreground/85">The Question</p>
                  <div className="border-l-2 border-l-accent/50 pl-3">
                    <p className="text-sm text-muted-foreground leading-7">{currentPrompt}</p>
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-border/80">
                <p className="war-label mb-3 text-foreground/85">You Will Be Evaluated On</p>
                <div className="space-y-3 text-sm">
                  {[
                    ["Clarity", "How directly and precisely you answered"],
                    ["Depth", "Whether you probed beneath the obvious"],
                    ["Consistency", "Whether your answer holds together internally"],
                    ["Self-Awareness", "Whether you recognised what was being exposed"],
                  ].map(([label, description]) => (
                    <div key={label} className="flex gap-3 items-start">
                      <p className="w-24 shrink-0 text-accent text-xs uppercase tracking-[0.08em] pt-0.5">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-6">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {socraticQuestionHistory.length > 0 && (
                <div>
                  <p className="war-label mb-3 text-foreground/85">Questions Posed So Far</p>
                  <div className="space-y-3">
                    {socraticQuestionHistory.map((entry) => (
                      <div key={entry.exchangeNumber} className="border-l-2 border-l-accent/40 pl-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                          {turnLabel("socratic", entry.exchangeNumber)}
                          {entry.isCurrent ? " · Now" : ""}
                        </p>
                        <p className={`text-sm leading-7 ${entry.isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                          {compactText(entry.prompt, 120)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {socraticAssumptionText && (
                <div className="border border-accent/15 bg-accent/5 px-4 py-4 space-y-2">
                  <p className="war-label text-accent">Assumption Under Examination</p>
                  <p className="text-sm text-muted-foreground leading-7">{socraticAssumptionText}</p>
                </div>
              )}

              {socraticSelfAwarenessTip && (
                <div className="pt-5 border-t border-border/80">
                  <p className="war-label mb-3 text-foreground/75">Self-Awareness Tip</p>
                  <div className="border-l-2 border-l-foreground/15 pl-3">
                    <p className="text-sm text-muted-foreground leading-7">{socraticSelfAwarenessTip}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      );
    }

    return (
      <aside className="hidden lg:flex flex-col gap-5 w-72 xl:w-80 shrink-0 border-l border-border pl-6 pt-2">
        {isUnlimitedDebate && (
          <div className="border border-foreground/10 bg-card/70 px-4 py-4 space-y-3">
            <p className="war-label text-foreground/85">Open-Ended Debate</p>
            <p className="text-sm text-muted-foreground leading-7">
              You control when this debate ends. Strike when you are ready to conclude - or keep going.
            </p>
            <Button
              size="sm"
              onClick={handleEndDebate}
              className="w-full justify-center bg-foreground text-background hover:bg-foreground/90 btn-press"
            >
              END DEBATE →
            </Button>
          </div>
        )}

        {roundTrend.some((entry) => entry.score !== null) && (
          <div className="pt-5 border-t border-border/80">
            <p className="war-label mb-3 text-foreground/85">Round Trend</p>
            <div className="space-y-2.5">
              {roundTrend.map((entry) => (
                <div key={entry.turnNumber} className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground w-10">
                    R{String(entry.turnNumber).padStart(2, "0")}
                  </span>
                  <div className="flex-1 h-2 bg-foreground/10 overflow-hidden">
                    {entry.score !== null && (
                      <div
                        className={`h-full ${scoreToneBarClass(getScoreTone(entry.score, maxScore))}`}
                        style={{ width: `${(entry.score / maxScore) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                    {entry.score !== null ? `${entry.score}/${maxScore}` : "--"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasKeyClaims && (
          <div className="pt-5 border-t border-border/80">
            <p className="war-label mb-3 text-foreground/85">{selectedFigure!.name.toUpperCase()} NOW ARGUES</p>
            <div className="space-y-3">
              {keyClaims!.map((claim, index) => (
                <p key={index} className="text-sm text-muted-foreground leading-7">
                  {claim}
                </p>
              ))}
            </div>
          </div>
        )}

        {scholarPassages.length > 0 && (
          <div className="pt-5 border-t border-border/80">
            <p className="war-label mb-1 text-foreground/85">Sources to Engage With</p>
            <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
            <div className="space-y-3">
              {scholarPassages.map((p, i) => (
                <div key={i} className="pl-3 border-l-2 border-border/70">
                  <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-6">
                    {p.text_excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tips.length > 0 && (
          <div className="border border-accent/20 border-l-2 border-l-accent/70 bg-card/70 px-4 py-4 space-y-2">
            {tips.map((tip, index) => (
              <p key={index} className="text-sm text-foreground/85 leading-7">
                • {tip}
              </p>
            ))}
          </div>
        )}
      </aside>
    );
  };

  // ── Mobile helper sections ────────────────────────────────────────────────
  const renderMobileHelpers = () => {
    if (isSocratic) {
      return (
        <div className="lg:hidden">
          <AccessibleDetails className="group/helpers">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
              <span className="group-open/helpers:rotate-90 transition-transform inline-block">▶</span>
              {currentDebate.turns.length === 0 ? "Dialogue guide" : "Dialogue notes"}
            </summary>
            <div className="mt-3 space-y-3">
              {currentDebate.turns.length === 0 ? (
                <>
                  <div className="border border-accent/20 bg-accent/5 px-4 py-4">
                    <p className="war-label text-accent mb-2">Socratic Dialogue</p>
                    <p className="text-sm text-muted-foreground leading-7">
                      {selectedFigure.name} will question you rather than argue. Answer directly, then examine what the question exposes.
                    </p>
                  </div>
                  {currentPrompt && (
                    <div className="p-4 border border-border">
                      <p className="war-label mb-2">The Question</p>
                      <p className="text-sm text-muted-foreground leading-7">{currentPrompt}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {socraticQuestionHistory.length > 0 && (
                    <div className="p-4 border border-border space-y-3">
                      <p className="war-label">Questions Posed So Far</p>
                      {socraticQuestionHistory.map((entry) => (
                        <div key={entry.exchangeNumber} className="border-l-2 border-l-accent/40 pl-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                            {turnLabel("socratic", entry.exchangeNumber)}
                            {entry.isCurrent ? " · Now" : ""}
                          </p>
                          <p className="text-sm text-muted-foreground leading-7">
                            {compactText(entry.prompt, 110)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {socraticAssumptionText && (
                    <div className="border border-accent/20 bg-accent/5 px-4 py-4">
                      <p className="war-label text-accent mb-2">Assumption Under Examination</p>
                      <p className="text-sm text-muted-foreground leading-7">{socraticAssumptionText}</p>
                    </div>
                  )}
                  {socraticSelfAwarenessTip && (
                    <div className="p-4 border border-border">
                      <p className="war-label mb-2">Self-Awareness Tip</p>
                      <p className="text-sm text-muted-foreground leading-7">{socraticSelfAwarenessTip}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </AccessibleDetails>
        </div>
      );
    }

    if (!hasAnyHelper && !isUnlimitedDebate) return null;

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
            {isUnlimitedDebate && (
              <div className="border border-foreground/10 bg-card/70 px-4 py-4">
                <p className="war-label mb-2">Open-Ended Debate</p>
                <p className="text-sm text-muted-foreground leading-7">
                  You control when this debate ends. End it when you think the exchange has run its course.
                </p>
              </div>
            )}
            {scholarPassages.length > 0 && (
              <div className="mb-4 p-4 border border-border">
                <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">Sources to Engage With</p>
                <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
                <div className="space-y-3">
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
            {isCompleted ? (
              <span className="inline-flex items-center px-3 py-1 border border-accent/30 text-accent text-[10px] uppercase tracking-[0.2em]">
                {resultsStatusLabel}
              </span>
            ) : (
              <>
                <span className="text-xs sm:text-sm font-bold tabular-nums text-muted-foreground">
                  {isFixedTurns
                    ? `${currentDebate.current_turn}/${currentDebate.max_turns}`
                    : `Turn ${currentDebate.current_turn}`}
                </span>

                {isUnlimitedDebate ? (
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
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ── Completed / Results screen ──────────────────────────────────── */}
        {isCompleted ? (
          <div className="arena-enter lg:grid lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-0 lg:border-t-0">
            <aside className="hidden lg:flex flex-col gap-3 pr-5 border-r border-border pt-4">
              <p className="war-label text-foreground/70 mb-1">
                {isSocratic ? "Dialogue Transcript" : "Debate Transcript"}
              </p>
              {turnSummaries.map((entry) => {
                const tone = entry.score !== null ? getScoreTone(entry.score, maxScore) : "low";
                return (
                  <div key={entry.turnNumber} className="border border-foreground/10 px-3 py-3 opacity-80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {entry.label}
                      </span>
                      <span className={`text-xs tabular-nums ${entry.score !== null ? scoreToneTextClass(tone) : "text-muted-foreground"}`}>
                        {entry.score !== null ? `${entry.score}/${maxScore}` : "--"}
                      </span>
                    </div>
                    <div className="h-1 bg-foreground/10 overflow-hidden">
                      {entry.score !== null && (
                        <div
                          className={`h-full ${scoreToneBarClass(tone)}`}
                          style={{ width: `${(entry.score / maxScore) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </aside>

            <div className="px-0 lg:px-14 py-4 lg:py-14">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                <Swords size={28} className="mb-3 text-foreground/25" />
                <p className={`war-label mb-4 ${outcomeToneClass}`}>{outcomeLabel}</p>
                <p className={`text-7xl sm:text-9xl font-bold tracking-tighter tabular-nums leading-none mb-2 score-reveal ${outcomeToneClass}`}>
                  {aggregateScore}
                </p>
                <p className="text-sm text-muted-foreground mb-10 uppercase tracking-[0.18em]">
                  {resultsProgressSubtitle}
                </p>

                {isSocratic && socraticAverages ? (
                  <>
                    <div className="arena-panel px-5 py-5 w-full text-left mb-6">
                      <p className="text-xs uppercase tracking-[0.15em] font-bold mb-4 text-foreground/80">
                        Dialogue Quality · Avg. Across All Exchanges
                      </p>
                      <div className="space-y-3">
                        {[
                          ["Clarity", socraticAverages.clarity],
                          ["Depth", socraticAverages.depth],
                          ["Consistency", socraticAverages.consistency],
                          ["Self-Awareness", socraticAverages.selfAwareness],
                        ].map(([label, value]) => {
                          const numeric = value as number;
                          const tone = getScoreTone(numeric, 10);
                          return (
                            <div key={label as string} className="flex items-center gap-3">
                              <span className={`w-28 text-xs uppercase tracking-[0.08em] ${tone === "high" ? "text-accent" : "text-foreground/80"}`}>
                                {label}
                              </span>
                              <div className="flex-1 h-2 bg-foreground/10 overflow-hidden">
                                <div
                                  className={`h-full ${scoreToneBarClass(tone)}`}
                                  style={{ width: `${numeric * 10}%` }}
                                />
                              </div>
                              <span className={`w-10 text-right text-sm tabular-nums ${scoreToneTextClass(tone)}`}>
                                {numeric.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {socraticDialogueMap.length > 0 && (
                      <div className="arena-panel px-5 py-5 w-full text-left mb-8">
                        <p className="text-xs uppercase tracking-[0.15em] font-bold mb-4 text-foreground/80">
                          Dialogue Map · Assumptions Exposed
                        </p>
                        <div className="space-y-0">
                          {socraticDialogueMap.map((entry, index) => (
                            <div
                              key={entry.exchangeNumber}
                              className={`flex gap-4 ${index < socraticDialogueMap.length - 1 ? "border-b border-border/80 pb-4 mb-4" : ""}`}
                            >
                              <div className="flex flex-col items-center pt-1">
                                <span className={`w-2 h-2 rounded-full ${index < socraticDialogueMap.length - 1 ? "bg-accent" : "bg-foreground/80"}`} />
                                {index < socraticDialogueMap.length - 1 && (
                                  <span className="w-px flex-1 bg-border mt-2" />
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                                  {turnLabel("socratic", entry.exchangeNumber)}
                                </p>
                                <p className="text-sm text-foreground/90 leading-7">{entry.insight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  roundTrend.length > 0 && (
                    <div className="arena-panel px-5 py-5 w-full text-left mb-8">
                      <p className="text-xs uppercase tracking-[0.15em] font-bold mb-4 text-foreground/80">
                        Round Trend
                      </p>
                      <div className="space-y-3">
                        {roundTrend.map((entry) => (
                          <div key={entry.turnNumber} className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-[0.15em] w-10 text-muted-foreground">
                              R{String(entry.turnNumber).padStart(2, "0")}
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
                  )
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                  <Link href="/figures" className="flex-1">
                    <Button
                      onClick={handleNewDebate}
                      className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press font-bold"
                    >
                      CHOOSE NEW OPPONENT →
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSameOpponentNewTopic}
                    className="flex-1 border-foreground/30 text-foreground hover:bg-secondary/40 btn-press"
                    title="Same opponent, different topic"
                  >
                    SAME OPPONENT, NEW TOPIC
                  </Button>
                </div>
              </div>
            </div>

            <aside className="mt-8 lg:mt-0 lg:border-l border-border lg:pl-6 lg:pt-5 space-y-5">
              {(learningSummaryText || learningKeyTakeaway || suggestedReadings.length > 0) && (
                <div className="space-y-5">
                  {learningSummaryText && (
                    <div>
                      <p className="war-label mb-3 text-foreground/85">Learning Summary</p>
                      <p className="text-sm text-muted-foreground leading-7">{learningSummaryText}</p>
                    </div>
                  )}

                  {learningKeyTakeaway && (
                    <div className="pt-5 border-t border-border/80">
                      <p className="war-label mb-3 text-foreground/85">{resultsKeyLabel}</p>
                      <div className="border border-foreground/15 px-4 py-4">
                        <p className="text-sm text-foreground/90 leading-7">{learningKeyTakeaway}</p>
                      </div>
                    </div>
                  )}

                  {isSocratic && (
                    <div className="pt-5 border-t border-border/80">
                      <p className="war-label mb-3 text-foreground/75">Socratic Rank</p>
                      <div className="space-y-2">
                        {[
                          ["DIALECTICIAN", "≥ 75%", aggregateScore >= 30],
                          ["INTERLOCUTOR", "50–74%", aggregateScore >= 20 && aggregateScore < 30],
                          ["NOVICE", "< 50%", aggregateScore < 20],
                        ].map(([label, range, isActive]) => (
                          <div
                            key={label as string}
                            className={`flex items-center gap-3 px-3 py-3 border ${isActive ? "border-accent/50 bg-accent/10" : "border-foreground/10 opacity-60"}`}
                          >
                            <span className={`text-sm tracking-[0.06em] ${isActive ? "text-accent" : "text-foreground/75"}`}>
                              {label}
                            </span>
                            <span className="ml-auto text-[10px] text-muted-foreground">{range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestedReadings.length > 0 && (
                    <div className="pt-5 border-t border-border/80">
                      <p className="war-label mb-3 text-foreground/85">Continue Learning</p>
                      <div className="space-y-3">
                        {suggestedReadings.map((reading, index) => (
                          <p key={index} className="text-sm text-muted-foreground leading-7">
                            • {reading.title}: {reading.reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>
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
                          {isSocratic ? "The Dialogue Opens" : "Opening Statement"}
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
                          {isSocratic ? "Answer the question" : "Your turn to respond"}
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
                        {isSocratic ? "Latest reflection" : "Latest score"} · {turnLabel(currentDebate.mode, latestScoredTurn.turn_number)}
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

                {/* Input helper */}
                {isSocratic ? (
                  <AccessibleDetails className="group/arghelper">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
                      <span className="group-open/arghelper:rotate-90 transition-transform inline-block">▶</span>
                      How to respond in Socratic dialogue
                    </summary>
                    <div className="mt-2 p-3 bg-secondary/30 border border-border text-sm space-y-1">
                      <p className="text-muted-foreground leading-7">
                        Answer the question directly, then show that you understand the assumption it is pressing on. Precision matters more than volume.
                      </p>
                    </div>
                  </AccessibleDetails>
                ) : (
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
