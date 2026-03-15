"use client";

import { useState, useRef, useEffect } from "react";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { SocraticDebateScores, StandardDebateScores } from "@/lib/types";
import {
  toScore,
  toOptionalScore,
  totalTurnScore,
  isSocraticScores,
  isStandardScores,
  getScoreTone,
  scoreToneTextClass,
  compactText,
  turnLabel,
  AccessibleDetails,
  MAX_SCORE,
} from "./shared";
import { DebateSidebar } from "./DebateSidebar";

interface Passage {
  title: string;
  text_excerpt: string;
}

interface Turn {
  turn_number: number;
  user_argument: string;
  figure_response: string;
  scores: StandardDebateScores | SocraticDebateScores | null;
  scores_error?: string | null;
  sources_used: string[];
  key_claims?: string[];
  passages?: Passage[];
}

interface DebateInputProps {
  figureName: string;
  mode: string;
  isSocratic: boolean;
  isLoading: boolean;
  error: string | null;
  turns: Turn[];
  openingStatement: string | null;
  openingKeyClaims: string[] | null;
  openingPassages: Passage[];
  structuredInput: boolean;
  setStructuredInput: (v: boolean) => void;
  isUnlimitedDebate: boolean;
  onSubmitArgument: (text: string) => Promise<void>;
  onEndDebate: () => Promise<void>;
}

export function DebateInput({
  figureName,
  mode,
  isSocratic,
  isLoading,
  error,
  turns,
  openingStatement,
  openingKeyClaims,
  openingPassages,
  structuredInput,
  setStructuredInput,
  isUnlimitedDebate,
  onSubmitArgument,
  onEndDebate,
}: DebateInputProps) {
  const [argument, setArgument] = useState("");

  const latestTurn = turns[turns.length - 1];
  const latestScoredTurn = [...turns].reverse().find((turn) => Boolean(turn.scores));
  const latestScoredTurnTotal = latestScoredTurn?.scores
    ? totalTurnScore(latestScoredTurn.scores)
    : null;
  const latestScoreToneClass =
    latestScoredTurnTotal !== null
      ? scoreToneTextClass(getScoreTone(latestScoredTurnTotal, MAX_SCORE))
      : "";

  const scholarPassages = turns.length > 0
    ? turns[turns.length - 1].passages ?? []
    : openingPassages;

  const keyClaims = turns.length > 0
    ? turns[turns.length - 1].key_claims
    : openingKeyClaims;
  const hasKeyClaims = keyClaims && keyClaims.length > 0;

  const tips: string[] = [];
  if (latestTurn?.scores && !isSocratic && isStandardScores(latestTurn.scores)) {
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
    if (!turn.scores) {
      return { turnNumber: turn.turn_number, score: null as number | null };
    }
    return { turnNumber: turn.turn_number, score: totalTurnScore(turn.scores) };
  });

  const submitLabel = isSocratic ? "RESPOND" : "STRIKE";
  const submitLoadingLabel = "JUDGING...";

  const textareaPlaceholder = isSocratic
    ? "Respond to the question..."
    : structuredInput
      ? "Claim: [Your main thesis]\nEvidence: [Cite or paraphrase a passage]\nWarrant: [Why this supports your claim]"
      : "Present your argument...";

  const savedArgumentRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && savedArgumentRef.current !== null) {
      setArgument(savedArgumentRef.current);
      savedArgumentRef.current = null;
    }
    if (!error && !isLoading && savedArgumentRef.current !== null) {
      savedArgumentRef.current = null;
    }
  }, [error, isLoading]);

  const handleSubmitArgument = async () => {
    if (!argument.trim()) return;
    const textToSubmit = argument.trim();
    savedArgumentRef.current = textToSubmit;
    setArgument("");
    await onSubmitArgument(textToSubmit);
  };

  return (
    <div className="space-y-4">
      {latestScoredTurn?.scores && latestScoredTurnTotal !== null && (
        <div className="arena-panel px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="war-label mb-1">
              {isSocratic ? "Latest reflection" : "Latest score"} · {turnLabel(mode, latestScoredTurn.turn_number)}
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
            <span className="text-xs font-normal text-muted-foreground">/{MAX_SCORE}</span>
          </p>
        </div>
      )}

      <DebateSidebar
        variant="mobile"
        figureName={figureName}
        isSocratic={isSocratic}
        isUnlimitedDebate={isUnlimitedDebate}
        turns={turns}
        currentPrompt={currentPrompt}
        scholarPassages={scholarPassages}
        tips={tips}
        hasKeyClaims={!!hasKeyClaims}
        keyClaims={keyClaims ?? []}
        hasAnyHelper={!!hasAnyHelper}
        socraticQuestionHistory={socraticQuestionHistory}
        socraticAssumptionText={socraticAssumptionText}
        socraticSelfAwarenessTip={socraticSelfAwarenessTip}
        roundTrend={roundTrend}
        onEndDebate={onEndDebate}
      />

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
  );
}
