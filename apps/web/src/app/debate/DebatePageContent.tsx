"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebateStore } from "@/stores/debate-store";
import {
  totalTurnScore,
  getScoreTone,
  scoreToneTextClass,
  modeDisplayName,
  MAX_SCORE,
} from "./components/shared";
import { DebateHeader } from "./components/DebateHeader";
import { DebateTranscript } from "./components/DebateTranscript";
import { DebateInput } from "./components/DebateInput";
import { DebateResults } from "./components/DebateResults";
import { DebateSidebar } from "./components/DebateSidebar";
import {
  toScore,
  toOptionalScore,
  isSocraticScores,
  isStandardScores,
  compactText,
  average,
} from "./components/shared";

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

  const activeDebateId = currentDebate?.id ?? currentDebateId ?? null;

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
    return () => { cancelled = true; };
  }, [currentDebate, selectedFigure, selectedTopic, fetchFigures, hydrateSelectionsFromDebate]);

  useEffect(() => {
    if (selectedFigure && selectedTopic && !currentDebate) {
      void prefetchTopicPrimer();
    }
  }, [selectedFigure, selectedTopic, currentDebate, prefetchTopicPrimer]);

  const handleStartDebate = async () => {
    await startDebate();
  };

  const handleEndDebate = async () => {
    await endDebate();
  };

  const handleNewDebate = () => {
    reset();
  };

  const handleSameOpponentNewTopic = () => {
    clearForNewTopic();
    router.push("/figures");
  };

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

  const isCompleted = currentDebate.status === "completed";
  const isDebateMode = currentDebate.mode === "debate";
  const isSocratic = currentDebate.mode === "socratic";
  const isFixedTurns = isDebateMode && currentDebate.max_turns > 0;
  const isUnlimitedDebate = isDebateMode && currentDebate.max_turns === 0;

  const scoredTurnTotals = currentDebate.turns
    .filter((turn) => Boolean(turn.scores))
    .map((turn) => totalTurnScore(turn.scores!));
  const latestTurn = currentDebate.turns[currentDebate.turns.length - 1];
  const latestTurnScore = latestTurn?.scores ? totalTurnScore(latestTurn.scores) : 0;
  const aggregateScore =
    scoredTurnTotals.length > 0
      ? Math.round(scoredTurnTotals.reduce((sum, n) => sum + n, 0) / scoredTurnTotals.length)
      : latestTurnScore;

  const socraticOutcomeLabel =
    aggregateScore >= 30 ? "DIALECTICIAN" : aggregateScore >= 20 ? "INTERLOCUTOR" : "NOVICE";
  const standardOutcomeLabel =
    aggregateScore >= 30 ? "VICTORY" : aggregateScore >= 20 ? "WELL FOUGHT" : "DEFEATED";
  const outcomeLabel = isSocratic ? socraticOutcomeLabel : standardOutcomeLabel;
  const outcomeToneClass = scoreToneTextClass(getScoreTone(aggregateScore, MAX_SCORE));

  const resultsStatusLabel = isSocratic ? "DIALOGUE COMPLETE" : "COMPLETED";
  const resultsKeyLabel = isSocratic ? "Key Insight" : "Key Takeaway";
  const resultsProgressSubtitle = isSocratic
    ? `of ${MAX_SCORE} · avg. across ${currentDebate.turns.length} exchange${currentDebate.turns.length === 1 ? "" : "s"}`
    : `of ${MAX_SCORE} possible`;

  const learningSummaryText = learningSummary?.summary ?? null;
  const learningKeyTakeaway = (learningSummary as { key_takeaway?: string } | null)?.key_takeaway ?? null;
  const suggestedReadings = learningSummary?.suggested_readings ?? [];

  const scholarPassages = currentDebate.turns.length > 0
    ? currentDebate.turns[currentDebate.turns.length - 1].passages ?? []
    : openingPassages;

  const keyClaims = currentDebate.turns.length > 0
    ? currentDebate.turns[currentDebate.turns.length - 1].key_claims
    : openingKeyClaims;
  const hasKeyClaims = keyClaims && keyClaims.length > 0 && selectedFigure;

  const tips: string[] = [];
  if (latestTurn?.scores && !isCompleted && !isSocratic && isStandardScores(latestTurn.scores)) {
    const s = latestTurn.scores;
    if (toScore(s.historical_accuracy_score) < 6) tips.push("Tip: Quote or paraphrase a passage they used. Check \"View sources used\".");
    if (toOptionalScore(s.rebuttal_score) < 6) tips.push("Tip: Respond directly to a claim they made.");
    if (toScore(s.logic_score) < 6) tips.push("Tip: Make your claim clear, then support it with evidence and reasoning.");
  }
  const hasAnyHelper = scholarPassages.length > 0 || tips.length > 0 || !!hasKeyClaims;

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

  const roundTrend = currentDebate.turns.map((turn) => {
    if (!turn.scores) return { turnNumber: turn.turn_number, score: null as number | null };
    return { turnNumber: turn.turn_number, score: totalTurnScore(turn.scores) };
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">
      <DebateHeader
        figureName={selectedFigure.name}
        topic={currentDebate.topic}
        mode={currentDebate.mode}
        isCompleted={isCompleted}
        isFixedTurns={isFixedTurns}
        isUnlimitedDebate={isUnlimitedDebate}
        isSocratic={isSocratic}
        currentTurn={currentDebate.current_turn}
        maxTurns={currentDebate.max_turns}
        resultsStatusLabel={resultsStatusLabel}
        onEndDebate={handleEndDebate}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {isCompleted ? (
          <DebateResults
            figureName={selectedFigure.name}
            mode={currentDebate.mode}
            isSocratic={isSocratic}
            turns={currentDebate.turns}
            maxTurns={currentDebate.max_turns}
            aggregateScore={aggregateScore}
            outcomeLabel={outcomeLabel}
            outcomeToneClass={outcomeToneClass}
            resultsProgressSubtitle={resultsProgressSubtitle}
            resultsKeyLabel={resultsKeyLabel}
            learningSummaryText={learningSummaryText}
            learningKeyTakeaway={learningKeyTakeaway}
            suggestedReadings={suggestedReadings}
            openingStatement={openingStatement}
            onNewDebate={handleNewDebate}
            onSameOpponentNewTopic={handleSameOpponentNewTopic}
          />
        ) : (
          <div className="flex gap-8 items-start max-w-6xl mx-auto">
            <div className="flex-1 min-w-0">
              <DebateTranscript
                turns={currentDebate.turns}
                mode={currentDebate.mode}
                figureName={selectedFigure.name}
                openingStatement={openingStatement}
                openingPassages={openingPassages}
                isLoading={isLoading}
                isSocratic={isSocratic}
                activeDebateId={activeDebateId}
              />

              <DebateInput
                figureName={selectedFigure.name}
                mode={currentDebate.mode}
                isSocratic={isSocratic}
                isLoading={isLoading}
                error={error}
                turns={currentDebate.turns}
                openingStatement={openingStatement}
                openingKeyClaims={openingKeyClaims}
                openingPassages={openingPassages}
                structuredInput={structuredInput}
                setStructuredInput={setStructuredInput}
                isUnlimitedDebate={isUnlimitedDebate}
                onSubmitArgument={submitArgument}
                onEndDebate={handleEndDebate}
              />
            </div>

            <DebateSidebar
              variant="desktop"
              figureName={selectedFigure.name}
              isSocratic={isSocratic}
              isUnlimitedDebate={isUnlimitedDebate}
              turns={currentDebate.turns}
              currentPrompt={currentPrompt}
              scholarPassages={scholarPassages}
              tips={tips}
              hasKeyClaims={!!hasKeyClaims}
              keyClaims={keyClaims ?? []}
              hasAnyHelper={hasAnyHelper}
              socraticQuestionHistory={socraticQuestionHistory}
              socraticAssumptionText={socraticAssumptionText}
              socraticSelfAwarenessTip={socraticSelfAwarenessTip}
              roundTrend={roundTrend}
              onEndDebate={handleEndDebate}
            />
          </div>
        )}
      </main>
    </div>
  );
}
