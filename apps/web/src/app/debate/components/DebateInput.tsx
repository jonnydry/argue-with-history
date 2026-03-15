"use client";

import { useState, useRef, useEffect } from "react";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Turn } from "./shared";
import {
  toScore,
  toOptionalScore,
  totalTurnScore,
  isSocraticScores,
  isStandardScores,
  getScoreTone,
  scoreToneTextClass,
  turnLabel,
  AccessibleDetails,
  MAX_SCORE,
} from "./shared";

interface DebateInputProps {
  mode: string;
  isSocratic: boolean;
  isLoading: boolean;
  error: string | null;
  turns: Turn[];
  structuredInput: boolean;
  setStructuredInput: (v: boolean) => void;
  onSubmitArgument: (text: string) => Promise<void>;
}

export function DebateInput({
  mode,
  isSocratic,
  isLoading,
  error,
  turns,
  structuredInput,
  setStructuredInput,
  onSubmitArgument,
}: DebateInputProps) {
  const [argument, setArgument] = useState("");

  const latestScoredTurn = [...turns].reverse().find((turn) => Boolean(turn.scores));
  const latestScoredTurnTotal = latestScoredTurn?.scores
    ? totalTurnScore(latestScoredTurn.scores)
    : null;
  const latestScoreToneClass =
    latestScoredTurnTotal !== null
      ? scoreToneTextClass(getScoreTone(latestScoredTurnTotal, MAX_SCORE))
      : "";

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
