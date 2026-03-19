"use client";

import { useRef, useEffect } from "react";
import { Swords } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SocraticDebateScores, StandardDebateScores } from "@/lib/types";
import { turnLabel, AccessibleDetails } from "./shared";
import { InlineScorecard } from "./ScorePanel";

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

interface DebateTranscriptProps {
  turns: Turn[];
  mode: string;
  figureName: string;
  openingStatement: string | null;
  openingPassages: Passage[];
  isLoading: boolean;
  isSocratic: boolean;
  activeDebateId: string | null;
}

export function DebateTranscript({
  turns,
  mode,
  figureName,
  openingStatement,
  openingPassages,
  isLoading,
  isSocratic,
  activeDebateId,
}: DebateTranscriptProps) {
  const transcriptContentRef = useRef<HTMLDivElement>(null);
  const transcriptViewportRef = useRef<HTMLDivElement | null>(null);
  const isPinnedToBottomRef = useRef(true);
  const previousTurnCountRef = useRef(0);
  const previousLatestTurnScoredRef = useRef(false);
  const SCROLL_PIN_THRESHOLD_PX = 40;

  const turnCount = turns.length;
  const latestTurnHasScore = Boolean(turns[turnCount - 1]?.scores);
  const latestTurn = turns[turns.length - 1];

  const scrollTranscriptToBottom = (behavior: ScrollBehavior = "auto") => {
    const viewport = transcriptViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
  };

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
  }, [activeDebateId]);

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

  return (
    <ScrollArea className="h-[50vh] sm:h-[60vh] mb-6">
      <div ref={transcriptContentRef} className="space-y-0 pr-2">
        {turns.length === 0 && openingStatement && (
          <div className="mb-6">
            <div className="debate-round-divider">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">
                {isSocratic ? "The Dialogue Opens" : "Opening Statement"}
              </span>
            </div>

            <div className="debate-figure-block p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-[0.2em] font-bold">
                  {figureName.toUpperCase()}
                </span>
              </div>
              <div className="prose-figure text-sm sm:text-base leading-relaxed text-background">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{openingStatement}</ReactMarkdown>
              </div>
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

        {turns.length === 0 && !openingStatement && (
          <div className="py-20 text-center arena-enter">
            <Swords size={32} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="editorial-display text-4xl sm:text-5xl mb-3">THE ARENA<br/><span className="headline-emphasis">AWAITS</span></p>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Present your opening argument below.</p>
          </div>
        )}

        {turns.map((turn) => {
          const isLatestTurn = turn.turn_number === latestTurn?.turn_number;
          return (
            <div key={turn.turn_number}>
              <div className="debate-round-divider">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground whitespace-nowrap">
                  {turnLabel(mode, turn.turn_number)}
                </span>
              </div>

              <div className="debate-you-block mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs border-foreground/30">YOU</Badge>
                </div>
                <div className="bg-secondary/40 border border-border/40 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.user_argument}</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="debate-figure-block p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold text-background">
                      {figureName.toUpperCase()}
                    </span>
                    {turn.sources_used.length > 0 && (
                      <span className="text-xs text-background/50">
                        {turn.sources_used.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="prose-figure text-sm sm:text-base leading-relaxed text-background">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.figure_response}</ReactMarkdown>
                  </div>
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

                <InlineScorecard turn={turn} isLatestTurn={isLatestTurn} isSocratic={isSocratic} />
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 py-8 text-muted-foreground arena-enter">
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm uppercase tracking-[0.2em] font-bold">
              {figureName.toUpperCase()} is {isSocratic ? "formulating a question" : "formulating a response"}...
            </span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
