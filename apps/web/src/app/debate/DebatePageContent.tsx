"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebateStore } from "@/stores/debate-store";
import {
  totalTurnScore,
  getScoreTone,
  scoreToneTextClass,
  deriveSidebarData,
  MAX_SCORE,
} from "./components/shared";
import { RestoringScreen, NoOpponentScreen, ReadyScreen } from "./components/PreDebateScreens";
import { DebateHeader } from "./components/DebateHeader";
import { DebateTranscript } from "./components/DebateTranscript";
import { DebateInput } from "./components/DebateInput";
import { DebateResults } from "./components/DebateResults";
import { DebateSidebar } from "./components/DebateSidebar";

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
    return <RestoringScreen />;
  }

  if (!selectedFigure || !selectedTopic) {
    return <NoOpponentScreen />;
  }

  if (!currentDebate) {
    return (
      <ReadyScreen
        figureName={selectedFigure.name}
        figureEra={selectedFigure.era}
        figureTraits={selectedFigure.traits ?? []}
        topicTitle={selectedTopic.title}
        debateMode={debateMode}
        maxTurns={maxTurns}
        isLoading={isLoading}
        error={error}
        effectivePrimer={effectivePrimer}
        onStartDebate={handleStartDebate}
      />
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

  const sidebarData = deriveSidebarData({
    turns: currentDebate.turns,
    openingStatement,
    openingKeyClaims,
    openingPassages,
    isSocratic,
    isCompleted,
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

              <DebateSidebar
                variant="mobile"
                figureName={selectedFigure.name}
                isSocratic={isSocratic}
                isUnlimitedDebate={isUnlimitedDebate}
                turns={currentDebate.turns}
                {...sidebarData}
                onEndDebate={handleEndDebate}
              />

              <DebateInput
                mode={currentDebate.mode}
                isSocratic={isSocratic}
                isLoading={isLoading}
                error={error}
                turns={currentDebate.turns}
                structuredInput={structuredInput}
                setStructuredInput={setStructuredInput}
                onSubmitArgument={submitArgument}
              />
            </div>

            <DebateSidebar
              variant="desktop"
              figureName={selectedFigure.name}
              isSocratic={isSocratic}
              isUnlimitedDebate={isUnlimitedDebate}
              turns={currentDebate.turns}
              {...sidebarData}
              onEndDebate={handleEndDebate}
            />
          </div>
        )}
      </main>
    </div>
  );
}
