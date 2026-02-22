"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Swords } from "lucide-react";

/** Coerce score value to integer 1-10. Prevents string concatenation in total. */
function toScore(val: unknown): number {
  const n = typeof val === "number" && !Number.isNaN(val) ? Math.round(val) : parseInt(String(val ?? ""), 10);
  const num = !Number.isNaN(n) ? n : 5;
  return Math.min(10, Math.max(1, num));
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebateStore } from "@/stores/debate-store";

export default function DebatePageContent() {
  const selectedFigure = useDebateStore((s) => s.selectedFigure);
  const selectedTopic = useDebateStore((s) => s.selectedTopic);
  const currentDebate = useDebateStore((s) => s.currentDebate);
  const openingStatement = useDebateStore((s) => s.openingStatement);
  const openingKeyClaims = useDebateStore((s) => s.openingKeyClaims);
  const openingPassages = useDebateStore((s) => s.openingPassages);
  const isLoading = useDebateStore((s) => s.isLoading);
  const error = useDebateStore((s) => s.error);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
  const prefetchTopicPrimer = useDebateStore((s) => s.prefetchTopicPrimer);
  const hydrateSelectionsFromDebate = useDebateStore((s) => s.hydrateSelectionsFromDebate);
  const structuredInput = useDebateStore((s) => s.structuredInput);
  const setStructuredInput = useDebateStore((s) => s.setStructuredInput);
  const scholarMode = useDebateStore((s) => s.scholarMode);
  const startDebate = useDebateStore((s) => s.startDebate);
  const submitArgument = useDebateStore((s) => s.submitArgument);
  const endDebate = useDebateStore((s) => s.endDebate);
  const reset = useDebateStore((s) => s.reset);
  const clearStaleDebateIfMismatch = useDebateStore((s) => s.clearStaleDebateIfMismatch);
  const learningSummary = useDebateStore((s) => s.learningSummary);
  const topicPrimer = useDebateStore((s) => s.topicPrimer);
  const topicPrimerKey = useDebateStore((s) => s.topicPrimerKey);

  const [argument, setArgument] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const effectivePrimer =
    topicPrimer && topicPrimerKey && selectedFigure && selectedTopic && topicPrimerKey === `${selectedFigure.id}:${selectedTopic.id}`
      ? topicPrimer
      : null;

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
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentDebate?.turns, openingStatement]);

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

  // ── No figure/topic selected ──────────────────────────────────────────────
  if (currentDebate && (!selectedFigure || !selectedTopic)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center noise-bg px-4">
        <Card className="max-w-md w-full border-2 contrast-border">
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
        <Card className="max-w-md w-full border-2 contrast-border">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">NO DEBATE SELECTED</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Choose a figure and topic first.
            </p>
            <Link href="/figures">
              <Button className="w-full bg-foreground text-background btn-press">
                SELECT OPPONENT
              </Button>
            </Link>
          </CardContent>
        </Card>
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
          <div className="max-w-xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Ready to Debate</p>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-[0.9] mb-8 sm:mb-12">
              {selectedFigure.name.toUpperCase()}
            </h2>

            <div className="border-t border-border pt-6 mb-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Topic</p>
                <p className="text-lg font-medium">{selectedTopic.title}</p>
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

            <Button
              onClick={handleStartDebate}
              disabled={isLoading}
              className="w-full text-base sm:text-lg py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  LOADING...
                </span>
              ) : (
                "BEGIN →"
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
  const latestTurn = currentDebate.turns[currentDebate.turns.length - 1];
  const maxScore = 40;
  const latestTurnScore = latestTurn?.scores
    ? [
        latestTurn.scores.logic_score,
        latestTurn.scores.historical_accuracy_score,
        latestTurn.scores.rhetoric_score,
        latestTurn.scores.rebuttal_score ?? 0,
      ].reduce((sum, v) => sum + toScore(v), 0)
    : 0;
  const scoredTurnTotals = currentDebate.turns
    .filter((turn) => Boolean(turn.scores))
    .map((turn) =>
      [
        turn.scores!.logic_score,
        turn.scores!.historical_accuracy_score,
        turn.scores!.rhetoric_score,
        turn.scores!.rebuttal_score ?? 0,
      ].reduce((sum, v) => sum + toScore(v), 0)
    );
  const aggregateScore =
    scoredTurnTotals.length > 0
      ? Math.round(scoredTurnTotals.reduce((sum, n) => sum + n, 0) / scoredTurnTotals.length)
      : latestTurnScore;
  const roundTrend = currentDebate.turns.map((turn) => {
    if (!turn.scores) {
      return { turnNumber: turn.turn_number, score: null as number | null };
    }
    const score = [
      turn.scores.logic_score,
      turn.scores.historical_accuracy_score,
      turn.scores.rhetoric_score,
      turn.scores.rebuttal_score ?? 0,
    ].reduce((sum, v) => sum + toScore(v), 0);
    return { turnNumber: turn.turn_number, score };
  });

  const scholarPassages = scholarMode
    ? (currentDebate.turns.length > 0
        ? currentDebate.turns[currentDebate.turns.length - 1].passages ?? []
        : openingPassages)
    : [];

  const tips: string[] = [];
  if (latestTurn?.scores && !isCompleted) {
    const s = latestTurn.scores;
    if (toScore(s.historical_accuracy_score) < 6) {
      tips.push("Tip: Quote or paraphrase a passage they used. Check \"View sources used\".");
    }
    if (toScore(s.rebuttal_score) < 6) {
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

  // ── Score cell renderer ───────────────────────────────────────────────────
  const renderScoreCell = (label: string, score: number, reason?: string) => {
    const isHigh = score >= 8;
    return (
      <div className="p-3 sm:p-4" title={reason || undefined}>
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none mb-2 ${isHigh ? "text-accent" : ""}`}>
          {score}<span className="text-sm font-normal text-muted-foreground">/10</span>
        </p>
        <div className="debate-score-bar-track">
          <div
            className={`debate-score-bar-fill ${isHigh ? "bg-accent" : "bg-foreground"}`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>
    );
  };

  // ── Inline scorecard renderer (per turn) ─────────────────────────────────
  const renderInlineScorecard = (turn: typeof currentDebate.turns[0]) => {
    if (turn.scores_error) {
      return (
        <p className="text-muted-foreground text-sm mt-4">{turn.scores_error}</p>
      );
    }
    if (!turn.scores) return null;

    const logic = toScore(turn.scores.logic_score);
    const historical = toScore(turn.scores.historical_accuracy_score);
    const rhetoric = toScore(turn.scores.rhetoric_score);
    const rebuttal = toScore(turn.scores.rebuttal_score);
    const turnTotal = logic + historical + rhetoric + rebuttal;

    const turnClaimChecks = "claim_checks" in turn.scores
      ? (turn.scores as { claim_checks?: Array<{ type: string; note: string }> }).claim_checks
      : undefined;
    const hasTurnClaims = Array.isArray(turnClaimChecks) && turnClaimChecks.length > 0;

    return (
      <div className="mt-6">
        <div className="debate-scorecard-divider">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">Scorecard</span>
        </div>

        <div className="debate-score-grid border border-border/30">
          {renderScoreCell("Logic", logic, turn.scores.logic_reason || undefined)}
          {renderScoreCell("Historical", historical, turn.scores.historical_reason || undefined)}
          {renderScoreCell("Rhetoric", rhetoric, turn.scores.rhetoric_reason || undefined)}
          {renderScoreCell("Rebuttal", rebuttal, turn.scores.rebuttal_reason || undefined)}
        </div>

        <div className="border border-border/30 border-t-0 px-4 py-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
          <span className="text-2xl font-bold tabular-nums">
            {turnTotal}<span className="text-sm font-normal text-muted-foreground">/{maxScore}</span>
          </span>
        </div>

        {(turn.scores.strengths?.length > 0 || turn.scores.improvements?.length > 0 || hasTurnClaims) && (
          <div className="mt-3 space-y-2">
            {turn.scores.strengths?.length > 0 && (
              <details className="group/strengths">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-green-400 list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/strengths:rotate-90 transition-transform inline-block">▶</span>
                  Strengths ({turn.scores.strengths.length})
                </summary>
                <div className="mt-1 p-3 bg-green-900/20 border border-green-800/50 space-y-1">
                  {turn.scores.strengths.map((s: string, i: number) => (
                    <p key={i} className="text-sm text-green-200">+ {s}</p>
                  ))}
                </div>
              </details>
            )}
            {turn.scores.improvements?.length > 0 && (
              <details className="group/improvements">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-amber-400 list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/improvements:rotate-90 transition-transform inline-block">▶</span>
                  Improvements ({turn.scores.improvements.length})
                </summary>
                <div className="mt-1 p-3 bg-amber-900/20 border border-amber-800/50 space-y-1">
                  {turn.scores.improvements.map((s: string, i: number) => (
                    <p key={i} className="text-sm text-amber-200">~ {s}</p>
                  ))}
                </div>
              </details>
            )}
            {hasTurnClaims && (
              <details className="group/claims">
                <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-blue-400 list-none flex items-center gap-1.5 py-1">
                  <span className="group-open/claims:rotate-90 transition-transform inline-block">▶</span>
                  Claim Check ({turnClaimChecks!.length})
                </summary>
                <div className="mt-1 p-3 bg-blue-900/20 border border-blue-800/50 space-y-1">
                  {turnClaimChecks!.map((c, i) => (
                    <p
                      key={i}
                      className={`text-sm ${
                        c.type === "accurate" ? "text-green-400"
                        : c.type === "mischaracterized" ? "text-amber-400"
                        : "text-muted-foreground"
                      }`}
                    >
                      {c.type === "accurate" ? "✓ " : c.type === "mischaracterized" ? "~ " : "· "}
                      {c.note}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Helper sections (key claims, tips, scholar sources) ───────────────────
  const renderHelperSections = () => (
    <>
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
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800/50">
          {tips.map((t, i) => (
            <p key={i} className="text-sm text-amber-200">• {t}</p>
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
    </>
  );

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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">

      {/* Header — matches homepage exactly */}
      <header className="border-b border-border sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Swords size={20} strokeWidth={1.5} className="shrink-0" />
            <Link href="/" className="text-base sm:text-xl font-bold tracking-tight hover:underline underline-offset-4 whitespace-nowrap">
              ARGUE WITH HISTORY
            </Link>
            <span className="hidden sm:block text-muted-foreground">·</span>
            <span className="hidden sm:block text-sm text-muted-foreground truncate">
              {selectedFigure.name} / {currentDebate.topic}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs sm:text-sm font-bold tabular-nums text-muted-foreground">
              {currentDebate.current_turn}/{currentDebate.max_turns}
            </span>
            {!isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndDebate}
                className="btn-press border-foreground/30 text-xs sm:text-sm"
              >
                END
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">

          {/* Scroll area for transcript */}
          <ScrollArea className="h-[50vh] sm:h-[60vh] mb-6">
            <div className="space-y-0 pr-2">

              {/* Opening statement */}
              {currentDebate.turns.length === 0 && openingStatement && (
                <div className="mb-6">
                  <div className="debate-round-divider">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">Opening Statement</span>
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
                      <details className="mt-4 group">
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
                      </details>
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your turn to respond</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {currentDebate.turns.length === 0 && !openingStatement && (
                <div className="py-20 text-center">
                  <p className="text-4xl font-bold tracking-tighter mb-3">THE DEBATE BEGINS</p>
                  <p className="text-muted-foreground text-sm uppercase tracking-[0.15em]">Present your opening argument.</p>
                </div>
              )}

              {/* Turns */}
              {currentDebate.turns.map((turn) => (
                <div key={turn.turn_number}>
                  {/* Round divider */}
                  <div className="debate-round-divider">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">
                      Round {String(turn.turn_number).padStart(2, "0")}
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
                        <details className="mt-4 group">
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
                        </details>
                      )}
                    </div>

                    {/* Inline scorecard */}
                    {renderInlineScorecard(turn)}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 py-6 text-muted-foreground">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm uppercase tracking-[0.15em]">Thinking...</span>
                </div>
              )}

              <div ref={scrollAnchorRef} aria-hidden />
            </div>
          </ScrollArea>

          {/* ── Completed banner ─────────────────────────────────────────── */}
          {isCompleted ? (
            <div className="debate-complete-banner p-8 sm:p-12 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-background/50 mb-3">Debate Complete</p>
              <p className="text-6xl sm:text-8xl font-bold tracking-tighter tabular-nums text-background leading-none mb-1">
                {aggregateScore}
              </p>
              <p className="text-sm text-background/50 mb-6 uppercase tracking-[0.15em]">average turn score out of {maxScore}</p>

              {roundTrend.length > 0 && (
                <div className="max-w-lg mx-auto mb-8 text-left">
                  <p className="text-xs uppercase tracking-[0.15em] font-bold mb-3 text-background/80">Round Trend</p>
                  <div className="space-y-2">
                    {roundTrend.map((entry) => (
                      <div key={entry.turnNumber} className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.15em] w-14 text-background/60">
                          R{String(entry.turnNumber).padStart(2, "0")}
                        </span>
                        <div className="flex-1 h-2 bg-background/20 overflow-hidden">
                          {entry.score !== null && (
                            <div
                              className="h-full bg-foreground"
                              style={{ width: `${(entry.score / maxScore) * 100}%` }}
                            />
                          )}
                        </div>
                        <span className="text-xs tabular-nums w-12 text-right text-background/70">
                          {entry.score !== null ? `${entry.score}/${maxScore}` : "--"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {learningSummary && (learningSummary.summary || (learningSummary as { key_takeaway?: string }).key_takeaway) && (
                <div className="text-left max-w-lg mx-auto mb-8 text-background">
                  <details className="sm:hidden group/learn">
                    <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] font-bold text-background list-none flex items-center gap-1.5 mb-2">
                      <span className="group-open/learn:rotate-90 transition-transform inline-block">▶</span>
                      Learning Summary
                    </summary>
                    <div className="mt-2">{renderLearningSummaryContent()}</div>
                  </details>
                  <div className="hidden sm:block">
                    <p className="text-xs uppercase tracking-[0.15em] font-bold mb-3">Learning Summary</p>
                    {renderLearningSummaryContent()}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/figures">
                  <Button className="bg-background text-foreground hover:bg-background/90 btn-press font-bold">
                    NEW DEBATE →
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleNewDebate}
                  className="border-background/30 text-background hover:bg-background/10 btn-press"
                >
                  DIFFERENT TOPIC
                </Button>
              </div>
            </div>
          ) : (
            // ── Input area ────────────────────────────────────────────────
            <div className="space-y-4">
              {/* Helpers: desktop expanded, mobile collapsible */}
              {hasAnyHelper && (
                <>
                  <div className="lg:hidden">
                    <details className="group/helpers">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
                        <span className="group-open/helpers:rotate-90 transition-transform inline-block">▶</span>
                        Debate aids
                        {tips.length > 0 && (
                          <Badge variant="outline" className="text-xs ml-1 py-0 border-amber-700 text-amber-400">Tips</Badge>
                        )}
                      </summary>
                      <div className="mt-3 space-y-3">{renderHelperSections()}</div>
                    </details>
                  </div>
                  <div className="hidden lg:block space-y-3">{renderHelperSections()}</div>
                </>
              )}

              {/* Argument structure helper */}
              <details className="group/arghelper">
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
              </details>

              <Textarea
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                placeholder={
                  structuredInput
                    ? "Claim: [Your main thesis]\nEvidence: [Cite or paraphrase a passage]\nWarrant: [Why this supports your claim]"
                    : "Present your argument..."
                }
                className="min-h-28 sm:min-h-36 bg-card border-2 border-border focus:border-foreground resize-none text-sm sm:text-base"
                disabled={isLoading}
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitArgument}
                  disabled={isLoading || !argument.trim()}
                  className="flex-1 text-sm sm:text-base py-5 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press font-bold"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      SUBMITTING...
                    </span>
                  ) : (
                    "SUBMIT →"
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
          )}
        </div>
      </main>
    </div>
  );
}
