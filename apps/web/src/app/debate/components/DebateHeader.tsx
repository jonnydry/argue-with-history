"use client";

import { useState } from "react";
import Link from "next/link";
import { CrossedSwords } from "@/components/icons/CrossedSwords";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { modeDisplayName } from "./shared";

interface DebateHeaderProps {
  figureName: string;
  topic: string;
  mode: string;
  isCompleted: boolean;
  isFixedTurns: boolean;
  isUnlimitedDebate: boolean;
  isSocratic: boolean;
  currentTurn: number;
  maxTurns: number;
  resultsStatusLabel: string;
  onEndDebate: () => Promise<void>;
}

export function DebateHeader({
  figureName,
  topic,
  mode,
  isCompleted,
  isFixedTurns,
  isUnlimitedDebate,
  isSocratic,
  currentTurn,
  maxTurns,
  resultsStatusLabel,
  onEndDebate,
}: DebateHeaderProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleEndClick = () => {
    setShowEndConfirm(true);
  };

  const handleConfirmEnd = async () => {
    setShowEndConfirm(false);
    await onEndDebate();
  };

  const modePill = (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.12em] border ${
        mode === "socratic"
          ? "text-accent border-accent/40 bg-accent/10"
          : "text-muted-foreground border-border/60 bg-secondary/40"
      }`}
    >
      {modeDisplayName(mode)}
    </span>
  );

  return (
    <>
      <header className="border-b border-border sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <CrossedSwords size={20} strokeWidth={1.5} className="shrink-0" />
            <Link href="/" className="text-base sm:text-xl font-bold tracking-tight hover:underline underline-offset-4 whitespace-nowrap">
              ARGUE WITH HISTORY
            </Link>
            <span className="hidden sm:block text-muted-foreground">·</span>
            <span className="hidden sm:block text-sm text-muted-foreground truncate">
              {figureName} / {topic}
            </span>
            <span className="hidden sm:inline-flex">{modePill}</span>
            <span className="sm:hidden">{modePill}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isCompleted ? (
              <span className="inline-flex items-center px-3 py-1 border border-accent/30 text-accent text-[10px] uppercase tracking-[0.2em]">
                {resultsStatusLabel}
              </span>
            ) : (
              <>
                <span className="text-xs sm:text-sm font-bold tabular-nums text-muted-foreground">
                  {isFixedTurns
                    ? `${currentTurn}/${maxTurns}`
                    : `${isSocratic ? "Exchange" : "Turn"} ${currentTurn}`}
                </span>

                {isUnlimitedDebate ? (
                  <Button
                    size="sm"
                    onClick={handleEndClick}
                    className="btn-press bg-foreground text-background hover:bg-foreground/90 font-bold text-xs sm:text-sm"
                  >
                    END DEBATE
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndClick}
                    className="btn-press border-foreground/30 text-xs sm:text-sm"
                  >
                    END
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent className="sm:max-w-md arena-panel">
          <DialogHeader>
            <DialogTitle className="text-lg uppercase tracking-wider">
              End {isSocratic ? "Dialogue" : "Debate"}?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-7">
              This will conclude the {isSocratic ? "dialogue" : "debate"} and calculate your final scores. You won&apos;t be able to submit more arguments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEndConfirm(false)}
              className="btn-press border-foreground/30"
            >
              CONTINUE {isSocratic ? "DIALOGUE" : "DEBATING"}
            </Button>
            <Button
              onClick={handleConfirmEnd}
              className="btn-press bg-foreground text-background hover:bg-foreground/90 font-bold"
            >
              END {isSocratic ? "DIALOGUE" : "DEBATE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
