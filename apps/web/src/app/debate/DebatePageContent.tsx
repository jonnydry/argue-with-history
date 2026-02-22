"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

/** Coerce score value to integer 1-10. Prevents string concatenation in total. */
function toScore(val: unknown): number {
  const n = typeof val === "number" && !Number.isNaN(val) ? Math.round(val) : parseInt(String(val ?? ""), 10);
  const num = !Number.isNaN(n) ? n : 5;
  return Math.min(10, Math.max(1, num));
}
import { api } from "@/lib/api";
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
  const [debateStarted, setDebateStarted] = useState(false);
  const [mobileScoreExpanded, setMobileScoreExpanded] = useState(false);
  const [primer, setPrimer] = useState<{
    position_summary?: string;
    sample_quote?: string | null;
    user_task?: string;
  } | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const effectivePrimer =
    topicPrimer && topicPrimerKey && selectedFigure && selectedTopic && topicPrimerKey === `${selectedFigure.id}:${selectedTopic.id}`
      ? topicPrimer
      : primer;

  // Clear previous debate when selected figure/topic no longer matches (e.g. user picked new opponent on /figures)
  useEffect(() => {
    clearStaleDebateIfMismatch();
  }, [currentDebate, selectedFigure?.id, selectedTopic?.id, clearStaleDebateIfMismatch]);

  useEffect(() => {
    if (currentDebate && currentDebate.turns.length > 0) {
      setDebateStarted(true);
    }
  }, [currentDebate]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentDebate?.turns, openingStatement]);

  useEffect(() => {
    if (selectedFigure && selectedTopic && !debateStarted && !currentDebate) {
      const key = `${selectedFigure.id}:${selectedTopic.id}`;
      if (topicPrimerKey === key && topicPrimer) {
        return;
      }
      api.figures
        .getTopicPrimer(selectedFigure.id, selectedTopic.id)
        .then(setPrimer)
        .catch(() => setPrimer(null));
    } else {
      setPrimer(null);
    }
  }, [selectedFigure?.id, selectedTopic?.id, debateStarted, currentDebate, topicPrimerKey, topicPrimer]);

  const handleStartDebate = async () => {
    await startDebate();
    setDebateStarted(true);
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
    setDebateStarted(false);
    setArgument("");
  };

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

  if (!debateStarted || !currentDebate) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center noise-bg px-4">
        <Card className="max-w-lg w-full border-2 contrast-border">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">READY TO DEBATE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">OPPONENT</p>
              <p className="text-xl font-bold">{selectedFigure.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">TOPIC</p>
              <p className="text-lg">{selectedTopic.title}</p>
            </div>
            {effectivePrimer && (
              <div className="p-4 bg-secondary/50 border border-border rounded-md space-y-2 text-left">
                <p className="text-sm font-medium">POSITION PRIMER</p>
                {effectivePrimer.position_summary && (
                  <p className="text-sm text-muted-foreground">{effectivePrimer.position_summary}</p>
                )}
                {effectivePrimer.sample_quote && (
                  <blockquote className="text-sm border-l-2 border-foreground/30 pl-3 italic">
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
              className="w-full text-lg py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press"
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
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = currentDebate.status === "completed";
  const latestTurn = currentDebate.turns[currentDebate.turns.length - 1];
  const maxScore = 40;
  const totalScore = latestTurn?.scores
    ? [latestTurn.scores.logic_score, latestTurn.scores.historical_accuracy_score, latestTurn.scores.rhetoric_score, latestTurn.scores.rebuttal_score ?? 0].reduce((sum, v) => sum + toScore(v), 0)
    : 0;

  // Hoist computed values for use in both mobile and desktop renders
  const claimChecks = latestTurn?.scores && "claim_checks" in latestTurn.scores
    ? (latestTurn.scores as { claim_checks?: Array<{ type: string; note: string }> }).claim_checks
    : undefined;
  const hasClaimChecks = Array.isArray(claimChecks) && claimChecks.length > 0;

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

  // Reusable score bars renderer
  const renderScoreBars = (barHeight: string) => {
    const logic = toScore(latestTurn!.scores!.logic_score);
    const historical = toScore(latestTurn!.scores!.historical_accuracy_score);
    const rhetoric = toScore(latestTurn!.scores!.rhetoric_score);
    const rebuttal = toScore(latestTurn!.scores!.rebuttal_score);
    const barFill = (score: number) =>
      score >= 8 ? "bg-accent" : "bg-foreground";
    return (
      <>
        <div title={latestTurn?.scores?.logic_reason || undefined}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Logic</span>
            <span className="font-bold tabular-nums">{logic}/10</span>
          </div>
          <div className={`${barHeight} bg-secondary rounded-sm overflow-hidden`}>
            <div
              className={`h-full ${barFill(logic)} transition-all duration-500`}
              style={{ width: `${logic * 10}%` }}
            />
          </div>
        </div>
        <div title={latestTurn?.scores?.historical_reason || undefined}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Historical</span>
            <span className="font-bold tabular-nums">{historical}/10</span>
          </div>
          <div className={`${barHeight} bg-secondary rounded-sm overflow-hidden`}>
            <div
              className={`h-full ${barFill(historical)} transition-all duration-500`}
              style={{ width: `${historical * 10}%` }}
            />
          </div>
        </div>
        <div title={latestTurn?.scores?.rhetoric_reason || undefined}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Rhetoric</span>
            <span className="font-bold tabular-nums">{rhetoric}/10</span>
          </div>
          <div className={`${barHeight} bg-secondary rounded-sm overflow-hidden`}>
            <div
              className={`h-full ${barFill(rhetoric)} transition-all duration-500`}
              style={{ width: `${rhetoric * 10}%` }}
            />
          </div>
        </div>
        <div title={latestTurn?.scores?.rebuttal_reason || undefined}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Rebuttal</span>
            <span className="font-bold tabular-nums">{rebuttal}/10</span>
          </div>
          <div className={`${barHeight} bg-secondary rounded-sm overflow-hidden`}>
            <div
              className={`h-full ${barFill(rebuttal)} transition-all duration-500`}
              style={{ width: `${rebuttal * 10}%` }}
            />
          </div>
        </div>
      </>
    );
  };

  // Reusable feedback sections renderer
  const renderFeedbackSections = (collapsible: boolean) => (
    <>
      {latestTurn!.scores!.strengths.length > 0 && (
        collapsible ? (
          <details className="group/strengths">
            <summary className="cursor-pointer text-xs text-green-400 list-none flex items-center gap-1">
              <span className="group-open/strengths:rotate-90 transition-transform">▶</span>
              STRENGTHS ({latestTurn!.scores!.strengths.length})
            </summary>
            <div className="mt-1 p-2 bg-green-900/20 border border-green-800">
              {latestTurn!.scores!.strengths.map((s, i) => (
                <p key={i} className="text-sm">+ {s}</p>
              ))}
            </div>
          </details>
        ) : (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800">
            <p className="text-xs text-green-400 mb-1">STRENGTHS</p>
            {latestTurn!.scores!.strengths.map((s, i) => (
              <p key={i} className="text-sm">+ {s}</p>
            ))}
          </div>
        )
      )}
      {latestTurn!.scores!.improvements.length > 0 && (
        collapsible ? (
          <details className="group/improvements">
            <summary className="cursor-pointer text-xs text-amber-400 list-none flex items-center gap-1">
              <span className="group-open/improvements:rotate-90 transition-transform">▶</span>
              IMPROVEMENTS ({latestTurn!.scores!.improvements.length})
            </summary>
            <div className="mt-1 p-2 bg-amber-900/20 border border-amber-800">
              {latestTurn!.scores!.improvements.map((s, i) => (
                <p key={i} className="text-sm">~ {s}</p>
              ))}
            </div>
          </details>
        ) : (
          <div className="mt-2 p-3 bg-amber-900/20 border border-amber-800">
            <p className="text-xs text-amber-400 mb-1">IMPROVEMENTS</p>
            {latestTurn!.scores!.improvements.map((s, i) => (
              <p key={i} className="text-sm">~ {s}</p>
            ))}
          </div>
        )
      )}
      {hasClaimChecks && (
        collapsible ? (
          <details className="group/claims">
            <summary className="cursor-pointer text-xs text-blue-400 list-none flex items-center gap-1">
              <span className="group-open/claims:rotate-90 transition-transform">▶</span>
              CLAIM CHECK ({claimChecks!.length})
            </summary>
            <div className="mt-1 p-2 bg-blue-900/20 border border-blue-800">
              {claimChecks!.map((c, i) => (
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
        ) : (
          <div className="mt-2 p-3 bg-blue-900/20 border border-blue-800">
            <p className="text-xs text-blue-400 mb-1">CLAIM CHECK</p>
            {claimChecks!.map((c, i) => (
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
        )
      )}
    </>
  );

  // Reusable helper sections (scholar sources, tips, key claims)
  const renderHelperSections = () => (
    <>
      {scholarPassages.length > 0 && (
        <div className="mb-4 p-4 bg-secondary/50 border-2 border-border rounded-md">
          <p className="text-sm font-medium mb-2">SOURCES TO ENGAGE WITH</p>
          <p className="text-xs text-muted-foreground mb-3">
            Review these passages before responding.
          </p>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {scholarPassages.map((p, i) => (
              <div key={i} className="pl-3 border-l-2 border-border">
                <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                  {p.text_excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {tips.length > 0 && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800 rounded-md">
          {tips.map((t, i) => (
            <p key={i} className="text-sm text-amber-200">• {t}</p>
          ))}
        </div>
      )}
      {hasKeyClaims && (
        <div className="p-4 bg-secondary/40 border-l-2 border-accent/50 rounded-r-md">
          <p className="text-sm font-blackletter text-foreground/90 mb-2">
            {selectedFigure!.name} argues
          </p>
          <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5 mb-3 pl-1">
            {keyClaims!.map((c, i) => (
              <li key={i} className="leading-relaxed">{c}</li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground italic">
            How do you respond to these points?
          </p>
        </div>
      )}
    </>
  );

  // Reusable learning summary content
  const renderLearningSummaryContent = () => (
    <>
      {learningSummary!.summary && (
        <p className="text-muted-foreground text-sm">{learningSummary!.summary}</p>
      )}
      {(learningSummary as { key_takeaway?: string }).key_takeaway && (
        <div className="mt-3 p-3 bg-secondary/50 border border-border rounded-md">
          <p className="text-xs font-medium mb-1">KEY TAKEAWAY</p>
          <p className="text-sm">{(learningSummary as { key_takeaway: string }).key_takeaway}</p>
        </div>
      )}
      {learningSummary!.suggested_readings && learningSummary!.suggested_readings.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">CONTINUE LEARNING</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {learningSummary!.suggested_readings.map((r, i) => {
              const rec = r as { title: string; reason: string; source_id?: string };
              return (
                <li key={i}>
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

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">
      <header className="border-b border-border debate-arena-header">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link href="/" className="text-sm sm:text-lg font-bold hover:underline">
              ARGUE WITH HISTORY
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
              <span className="font-blackletter text-foreground/90">{selectedFigure.name}</span>
              <span className="mx-1.5">·</span>
              {currentDebate.topic}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="text-xs sm:text-sm font-blackletter text-accent whitespace-nowrap">
              {currentDebate.current_turn}/{currentDebate.max_turns}
            </span>
            {!isCompleted && (
              <Button variant="outline" size="sm" onClick={handleEndDebate} className="btn-press text-xs sm:text-sm">
                END
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile-only compact score bar */}
      {latestTurn?.scores && (
        <div className="lg:hidden sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm debate-arena-header">
          <div className="container mx-auto px-3 py-2">
            <button
              onClick={() => setMobileScoreExpanded(!mobileScoreExpanded)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-blackletter">Score: <span className="text-accent tabular-nums">{totalScore}/{maxScore}</span></span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>L:{toScore(latestTurn.scores.logic_score)}</span>
                  <span>H:{toScore(latestTurn.scores.historical_accuracy_score)}</span>
                  <span>R:{toScore(latestTurn.scores.rhetoric_score)}</span>
                  <span>Rb:{toScore(latestTurn.scores.rebuttal_score)}</span>
                </div>
              </div>
              <span className={`transition-transform text-xs ${mobileScoreExpanded ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            {mobileScoreExpanded && (
              <div className="pt-2 pb-1 space-y-2 border-t border-border mt-2">
                {renderScoreBars("h-2")}
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-blackletter">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-accent tabular-nums">{totalScore}/{maxScore}</span>
                  </div>
                </div>
                {renderFeedbackSections(true)}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
          <div className="hidden lg:block lg:col-span-1 order-2 lg:order-1">
            <Card className="border-2 contrast-border debate-score-accent sticky top-4 lg:top-24 overflow-hidden">
              <CardHeader className="border-b border-border py-3 sm:py-4 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-blackletter tracking-wide">SCORE</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4 px-4 sm:px-6">
                {latestTurn?.scores_error ? (
                  <p className="text-muted-foreground text-sm">{latestTurn.scores_error}</p>
                ) : latestTurn?.scores ? (
                  <>
                    {renderScoreBars("h-3")}
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between font-blackletter text-lg">
                        <span className="text-muted-foreground">TOTAL</span>
                        <span className="text-accent">{totalScore}/{maxScore}</span>
                      </div>
                    </div>
                    {renderFeedbackSections(false)}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Submit argument for scores</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="border-2 contrast-border relative">
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] sm:h-[500px] p-3 sm:p-6 debate-manuscript relative">
                  {currentDebate.turns.length === 0 && openingStatement && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-foreground text-background font-blackletter tracking-wide">
                          {selectedFigure.name.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Opening Statement</span>
                      </div>
                      <Card className="border-2 contrast-border">
                        <CardContent className="p-4">
                          <p className="whitespace-pre-wrap">{openingStatement}</p>
                        </CardContent>
                      </Card>
                      {openingPassages.length > 0 && (
                        <details className="mt-3 group">
                          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            View sources used
                          </summary>
                          <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
                            {openingPassages.map((p, i) => (
                              <div key={i} className="pl-3">
                                <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      <div className="mt-6 text-center">
                        <p className="text-sm font-blackletter text-muted-foreground tracking-wide">Your turn to respond</p>
                      </div>
                    </div>
                  )}
                  
                  {currentDebate.turns.length === 0 && !openingStatement && (
                    <div className="text-center py-16">
                      <p className="text-2xl font-blackletter mb-2">The Debate Begins</p>
                      <p className="text-muted-foreground text-sm">Present your opening argument.</p>
                    </div>
                  )}
                  
                  {currentDebate.turns.map((turn) => (
                    <div key={turn.turn_number} className="mb-8">
                      <div className="mb-4 pl-4 debate-turn-you">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">YOU</Badge>
                          <span className="text-xs text-muted-foreground font-blackletter">Turn {turn.turn_number}</span>
                        </div>
                        <Card className="bg-secondary/60 border border-border/50">
                          <CardContent className="p-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.user_argument}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="pl-4 debate-turn-opponent">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-foreground text-background font-blackletter tracking-wide">
                            {selectedFigure.name.toUpperCase()}
                          </Badge>
                          {turn.sources_used.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {turn.sources_used.join(", ")}
                            </span>
                          )}
                        </div>
                        <Card className="border-2 contrast-border">
                          <CardContent className="p-4">
                            <p className="whitespace-pre-wrap">{turn.figure_response}</p>
                          </CardContent>
                        </Card>
                        {turn.passages && turn.passages.length > 0 && (
                          <details className="mt-3 group">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                              <span className="group-open:rotate-90 transition-transform">▶</span>
                              View sources used
                            </summary>
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
                              {turn.passages.map((p, i) => (
                                <div key={i} className="pl-3">
                                  <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                                  <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                  <div ref={scrollAnchorRef} aria-hidden />
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="mt-4 sm:mt-6">
              {isCompleted ? (
                <Card className="border-2 contrast-border overflow-hidden">
                  <CardContent className="p-4 sm:p-8 text-center">
                    <p className="text-2xl sm:text-3xl font-blackletter tracking-wide mb-2">Debate Complete</p>
                    <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6">
                      Final score: <span className="font-blackletter text-accent tabular-nums">{totalScore}/{maxScore}</span>
                    </p>
                    {learningSummary && (learningSummary.summary || (learningSummary as { key_takeaway?: string }).key_takeaway) && (
                      <>
                        {/* Mobile: collapsible learning summary */}
                        <details className="lg:hidden mb-4 text-left max-w-xl mx-auto group/learn">
                          <summary className="cursor-pointer text-sm font-medium list-none flex items-center gap-1">
                            <span className="group-open/learn:rotate-90 transition-transform">▶</span>
                            LEARNING SUMMARY
                          </summary>
                          <div className="mt-2">
                            {renderLearningSummaryContent()}
                          </div>
                        </details>
                        {/* Desktop: always visible */}
                        <div className="hidden lg:block mb-6 text-left max-w-xl mx-auto">
                          <p className="text-sm font-medium mb-2">LEARNING SUMMARY</p>
                          {renderLearningSummaryContent()}
                        </div>
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <Link href="/figures">
                        <Button className="bg-foreground text-background btn-press">NEW DEBATE</Button>
                      </Link>
                      <Button variant="outline" onClick={handleNewDebate} className="btn-press">
                        DIFFERENT TOPIC
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Mobile: collapse helpers into one toggle */}
                  {hasAnyHelper && (
                    <div className="lg:hidden">
                      <details className="group/helpers mb-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                          <span className="group-open/helpers:rotate-90 transition-transform">▶</span>
                          Debate aids
                          {tips.length > 0 && (
                            <Badge variant="outline" className="text-xs ml-1 py-0">Tips</Badge>
                          )}
                        </summary>
                        <div className="mt-2 space-y-3">
                          {renderHelperSections()}
                        </div>
                      </details>
                    </div>
                  )}
                  {/* Desktop: show helpers expanded */}
                  <div className="hidden lg:block space-y-4">
                    {renderHelperSections()}
                  </div>
                  <details className="group/details mb-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
                      <span className="group-open/details:rotate-90 transition-transform">▶</span>
                      Argument structure helper
                    </summary>
                    <div className="mt-2 p-3 bg-secondary/30 border border-border rounded text-sm space-y-1">
                      <p className="text-muted-foreground">Claim: Your main thesis. Evidence: Cite or paraphrase a passage. Warrant: Why this supports your claim.</p>
                      <button
                        type="button"
                        onClick={() => setStructuredInput(!structuredInput)}
                        className="text-xs text-foreground/80 hover:underline"
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
                    className="min-h-24 sm:min-h-32 bg-card border-2 border-border focus:border-foreground resize-none text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2 sm:gap-4">
                    <Button
                      onClick={handleSubmitArgument}
                      disabled={isLoading || !argument.trim()}
                      className="flex-1 text-sm sm:text-lg py-4 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press"
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
                      className="btn-press"
                    >
                      CLEAR
                    </Button>
                  </div>
                  {error && (
                    <p className="text-destructive text-sm">{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
