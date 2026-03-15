"use client";

import { useState } from "react";
import Link from "next/link";
import { Swords } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SocraticDebateScores, StandardDebateScores } from "@/lib/types";
import {
  toScore,
  totalTurnScore,
  isSocraticScores,
  average,
  getScoreTone,
  scoreToneTextClass,
  scoreToneBarClass,
  compactText,
  turnLabel,
  AccessibleDetails,
  MAX_SCORE,
} from "./shared";

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

interface DebateResultsProps {
  figureName: string;
  mode: string;
  isSocratic: boolean;
  turns: Turn[];
  maxTurns: number;
  aggregateScore: number;
  outcomeLabel: string;
  outcomeToneClass: string;
  resultsProgressSubtitle: string;
  resultsKeyLabel: string;
  learningSummaryText: string | null;
  learningKeyTakeaway: string | null;
  suggestedReadings: Array<{ title: string; reason: string }>;
  openingStatement: string | null;
  onNewDebate: () => void;
  onSameOpponentNewTopic: () => void;
}

export function DebateResults({
  figureName,
  mode,
  isSocratic,
  turns,
  aggregateScore,
  outcomeLabel,
  outcomeToneClass,
  resultsProgressSubtitle,
  resultsKeyLabel,
  learningSummaryText,
  learningKeyTakeaway,
  suggestedReadings,
  openingStatement,
  onNewDebate,
  onSameOpponentNewTopic,
}: DebateResultsProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  const turnSummaries = turns.map((turn) => ({
    turnNumber: turn.turn_number,
    label: turnLabel(mode, turn.turn_number),
    score: turn.scores ? totalTurnScore(turn.scores) : null,
  }));

  const roundTrend = turns.map((turn) => {
    if (!turn.scores) return { turnNumber: turn.turn_number, score: null as number | null };
    return { turnNumber: turn.turn_number, score: totalTurnScore(turn.scores) };
  });

  const scoredSocraticTurns = turns.flatMap((turn) =>
    turn.scores && isSocraticScores(turn.scores) ? [{ turn, scores: turn.scores }] : []
  );

  const socraticAverages = scoredSocraticTurns.length
    ? {
        clarity: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.clarity_score))),
        depth: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.depth_score))),
        consistency: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.consistency_score))),
        selfAwareness: average(scoredSocraticTurns.map(({ scores }) => toScore(scores.self_awareness_score))),
      }
    : null;

  const socraticDialogueMap = scoredSocraticTurns.map(({ turn, scores }) => ({
    exchangeNumber: turn.turn_number,
    insight: compactText(
      scores.self_awareness_reason ?? scores.improvements?.[0] ?? scores.depth_reason ?? turn.user_argument,
      120
    ) ?? "An underlying assumption came under pressure.",
  }));

  return (
    <div className="arena-enter lg:grid lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-0 lg:border-t-0">
      <aside className="hidden lg:flex flex-col gap-3 pr-5 border-r border-border pt-4">
        <p className="war-label text-foreground/70 mb-1">
          {isSocratic ? "Dialogue Transcript" : "Debate Transcript"}
        </p>
        {turnSummaries.map((entry) => {
          const tone = entry.score !== null ? getScoreTone(entry.score, MAX_SCORE) : "low";
          return (
            <div key={entry.turnNumber} className="border border-foreground/10 px-3 py-3 opacity-80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {entry.label}
                </span>
                <span className={`text-xs tabular-nums ${entry.score !== null ? scoreToneTextClass(tone) : "text-muted-foreground"}`}>
                  {entry.score !== null ? `${entry.score}/${MAX_SCORE}` : "--"}
                </span>
              </div>
              <div className="h-1 bg-foreground/10 overflow-hidden">
                {entry.score !== null && (
                  <div
                    className={`h-full ${scoreToneBarClass(tone)}`}
                    style={{ width: `${(entry.score / MAX_SCORE) * 100}%` }}
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
                            className={`h-full ${scoreToneBarClass(getScoreTone(entry.score, MAX_SCORE))}`}
                            style={{ width: `${(entry.score / MAX_SCORE) * 100}%` }}
                          />
                        )}
                      </div>
                      <span className="text-xs tabular-nums w-12 text-right text-muted-foreground">
                        {entry.score !== null ? `${entry.score}/${MAX_SCORE}` : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="w-full text-left mb-8">
            <AccessibleDetails
              className="group/transcript arena-panel"
              open={showTranscript}
              onToggle={(e) => setShowTranscript((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer px-5 py-4 list-none flex items-center gap-2">
                <span className="group-open/transcript:rotate-90 transition-transform inline-block text-muted-foreground">▶</span>
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-foreground/80">
                  Full {isSocratic ? "Dialogue" : "Debate"} Transcript
                </span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {turns.length} {isSocratic ? (turns.length === 1 ? "exchange" : "exchanges") : (turns.length === 1 ? "round" : "rounds")}
                </span>
              </summary>
              <div className="px-5 pb-5 space-y-6 border-t border-border/50 pt-4">
                {openingStatement && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
                        {isSocratic ? "Opening" : "Opening Statement"}
                      </span>
                    </div>
                    <div className="debate-figure-block p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase tracking-[0.15em] font-bold text-background">
                          {figureName.toUpperCase()}
                        </span>
                      </div>
                      <div className="prose-figure text-sm leading-relaxed text-background">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{openingStatement}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {turns.map((turn) => (
                  <div key={turn.turn_number} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
                        {turnLabel(mode, turn.turn_number)}
                      </span>
                      {turn.scores && (
                        <span className={`text-xs tabular-nums ml-auto ${scoreToneTextClass(getScoreTone(totalTurnScore(turn.scores), MAX_SCORE))}`}>
                          {totalTurnScore(turn.scores)}/{MAX_SCORE}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="font-mono text-xs border-foreground/30">YOU</Badge>
                      </div>
                      <div className="bg-secondary/40 border border-border/40 p-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.user_argument}</p>
                      </div>
                    </div>

                    <div>
                      <div className="debate-figure-block p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs uppercase tracking-[0.15em] font-bold text-background">
                            {figureName.toUpperCase()}
                          </span>
                        </div>
                        <div className="prose-figure text-sm leading-relaxed text-background">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.figure_response}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccessibleDetails>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
            <Link href="/figures" className="flex-1">
              <Button
                onClick={onNewDebate}
                className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press font-bold"
              >
                CHOOSE NEW OPPONENT →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onSameOpponentNewTopic}
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
  );
}
