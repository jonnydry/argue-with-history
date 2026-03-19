"use client";

import Link from "next/link";
import { CrossedSwords } from "@/components/icons/CrossedSwords";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modeDisplayName } from "./shared";

export function RestoringScreen() {
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

export function NoOpponentScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center noise-bg px-4">
      <div className="max-w-md w-full text-center arena-enter">
        <CrossedSwords size={40} className="mx-auto mb-6 text-muted-foreground/30" />
        <h2 className="editorial-display text-3xl sm:text-4xl mb-3">NO OPPONENT<br/><span className="headline-emphasis">SELECTED</span></h2>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          Choose a figure and topic to enter the arena.
        </p>
        <Link href="/figures">
          <Button className="w-full text-base py-5 h-auto bg-foreground text-background btn-press font-bold tracking-wider">
            <CrossedSwords size={18} className="mr-2" />
            SELECT OPPONENT
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface ReadyScreenProps {
  figureName: string;
  figureEra: string;
  figureTraits: string[];
  topicTitle: string;
  debateMode: string;
  maxTurns: number;
  isLoading: boolean;
  error: string | null;
  effectivePrimer: {
    position_summary?: string;
    sample_quote?: string | null;
    user_task?: string;
  } | null;
  onStartDebate: () => Promise<void>;
}

export function ReadyScreen({
  figureName,
  figureEra,
  figureTraits,
  topicTitle,
  debateMode,
  maxTurns,
  isLoading,
  error,
  effectivePrimer,
  onStartDebate,
}: ReadyScreenProps) {
  const readyTurnsLabel =
    debateMode === "debate" ? (maxTurns > 0 ? String(maxTurns) : "Open") : "Open";

  return (
    <div className="min-h-screen bg-background text-foreground noise-bg">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <CrossedSwords size={20} strokeWidth={1.5} className="shrink-0" />
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
              {figureName.split(" ").map((word, i, arr) => (
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
              {figureEra} · {figureTraits.slice(0, 3).join(" · ")}
            </p>

            <div className="arena-divider mb-8">
              <CrossedSwords size={14} className="text-muted-foreground/40" />
            </div>

            <div className="mb-10 space-y-6 max-w-2xl">
              <div>
                <p className="war-label mb-2">TOPIC OF CONTENTION</p>
                <p className="editorial-section-title text-2xl sm:text-3xl leading-tight">
                  {topicTitle}
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
              onClick={onStartDebate}
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
                  <CrossedSwords size={20} />
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
