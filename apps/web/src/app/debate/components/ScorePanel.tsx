"use client";

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
  scoreToneBarClass,
  compactText,
  AccessibleDetails,
  MAX_SCORE,
} from "./shared";

function ScoreCell({ label, score, reason }: { label: string; score: number; reason?: string }) {
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
}

interface TurnType {
  turn_number: number;
  user_argument: string;
  figure_response: string;
  scores: StandardDebateScores | SocraticDebateScores | null;
  scores_error?: string | null;
  sources_used: string[];
  key_claims?: string[];
  passages?: Array<{ title: string; text_excerpt: string }>;
}

export function InlineScorecard({
  turn,
  isLatestTurn,
  isSocratic,
}: {
  turn: TurnType;
  isLatestTurn: boolean;
  isSocratic: boolean;
}) {
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
        <ScoreCell label="Clarity" score={clarity} reason={scores.clarity_reason as string | undefined} />
        <ScoreCell label="Depth" score={depth} reason={scores.depth_reason as string | undefined} />
        <ScoreCell label="Consistency" score={consistency} reason={scores.consistency_reason as string | undefined} />
        <ScoreCell label="Self-Awareness" score={selfAwareness} reason={scores.self_awareness_reason as string | undefined} />
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
        <ScoreCell label="Logic" score={logic} reason={standardScores?.logic_reason || undefined} />
        <ScoreCell label="Historical" score={historical} reason={standardScores?.historical_reason || undefined} />
        <ScoreCell label="Rhetoric" score={rhetoric} reason={standardScores?.rhetoric_reason || undefined} />
        <ScoreCell label="Rebuttal" score={rebuttal} reason={standardScores?.rebuttal_reason || undefined} />
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
          {turnTotal}<span className="text-sm font-normal text-muted-foreground">/{MAX_SCORE}</span>
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
            {turnTotal}<span className="text-xs font-normal text-muted-foreground">/{MAX_SCORE}</span>
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
}
