"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  turnLabel,
  compactText,
  getScoreTone,
  scoreToneBarClass,
  AccessibleDetails,
  MAX_SCORE,
} from "./shared";

interface Passage {
  title: string;
  text_excerpt: string;
}

interface DebateSidebarProps {
  variant: "desktop" | "mobile";
  figureName: string;
  isSocratic: boolean;
  isUnlimitedDebate: boolean;
  turns: Array<{ turn_number: number; figure_response: string; scores?: unknown }>;
  currentPrompt: string | null;
  scholarPassages: Passage[];
  tips: string[];
  hasKeyClaims: boolean;
  keyClaims: string[];
  hasAnyHelper: boolean;
  socraticQuestionHistory: Array<{
    exchangeNumber: number;
    prompt: string;
    isCurrent: boolean;
  }>;
  socraticAssumptionText: string | null;
  socraticSelfAwarenessTip: string | null;
  roundTrend: Array<{ turnNumber: number; score: number | null }>;
  onEndDebate: () => Promise<void>;
}

function SourcesList({ passages }: { passages: Passage[] }) {
  if (passages.length === 0) return null;
  return (
    <div className="space-y-3">
      {passages.map((p, i) => (
        <div key={i} className="pl-3 border-l-2 border-border/70">
          <p className="text-xs font-medium text-foreground/80">{p.title}</p>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-6">{p.text_excerpt}</p>
        </div>
      ))}
    </div>
  );
}

function DesktopSocraticSidebar({
  figureName,
  turns,
  currentPrompt,
  scholarPassages,
  socraticQuestionHistory,
  socraticAssumptionText,
  socraticSelfAwarenessTip,
}: Pick<
  DebateSidebarProps,
  "figureName" | "turns" | "currentPrompt" | "scholarPassages" | "socraticQuestionHistory" | "socraticAssumptionText" | "socraticSelfAwarenessTip"
>) {
  return (
    <aside className="hidden lg:flex flex-col gap-5 w-72 xl:w-80 shrink-0 border-l border-border pl-6 pt-2">
      {turns.length === 0 ? (
        <>
          <div className="border border-accent/20 bg-accent/5 px-4 py-4 space-y-3">
            <p className="war-label text-accent">Socratic Dialogue</p>
            <p className="text-sm text-muted-foreground leading-7">
              {figureName} will not argue with you - {" "}
              they will question you. Each answer exposes an assumption in what you said.
            </p>
          </div>

          {currentPrompt && (
            <div className="pt-5 border-t border-border/80">
              <p className="war-label mb-3 text-foreground/85">The Question</p>
              <div className="border-l-2 border-l-accent/50 pl-3">
                <p className="text-sm text-muted-foreground leading-7">{currentPrompt}</p>
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-border/80">
            <p className="war-label mb-3 text-foreground/85">You Will Be Evaluated On</p>
            <div className="space-y-3 text-sm">
              {[
                ["Clarity", "How directly and precisely you answered"],
                ["Depth", "Whether you probed beneath the obvious"],
                ["Consistency", "Whether your answer holds together internally"],
                ["Self-Awareness", "Whether you recognised what was being exposed"],
              ].map(([label, description]) => (
                <div key={label} className="flex gap-3 items-start">
                  <p className="w-24 shrink-0 text-accent text-xs uppercase tracking-[0.08em] pt-0.5">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-6">{description}</p>
                </div>
              ))}
            </div>
          </div>

          {scholarPassages.length > 0 && (
            <div className="pt-5 border-t border-border/80">
              <p className="war-label mb-1 text-foreground/85">Sources to Engage With</p>
              <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
              <SourcesList passages={scholarPassages} />
            </div>
          )}
        </>
      ) : (
        <>
          {socraticQuestionHistory.length > 0 && (
            <div>
              <p className="war-label mb-3 text-foreground/85">Questions Posed So Far</p>
              <div className="space-y-3">
                {socraticQuestionHistory.map((entry) => (
                  <div key={entry.exchangeNumber} className="border-l-2 border-l-accent/40 pl-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                      {turnLabel("socratic", entry.exchangeNumber)}
                      {entry.isCurrent ? " · Now" : ""}
                    </p>
                    <p className={`text-sm leading-7 ${entry.isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                      {compactText(entry.prompt, 120)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {socraticAssumptionText && (
            <div className="border border-accent/15 bg-accent/5 px-4 py-4 space-y-2">
              <p className="war-label text-accent">Assumption Under Examination</p>
              <p className="text-sm text-muted-foreground leading-7">{socraticAssumptionText}</p>
            </div>
          )}

          {socraticSelfAwarenessTip && (
            <div className="pt-5 border-t border-border/80">
              <p className="war-label mb-3 text-foreground/75">Self-Awareness Tip</p>
              <div className="border-l-2 border-l-foreground/15 pl-3">
                <p className="text-sm text-muted-foreground leading-7">{socraticSelfAwarenessTip}</p>
              </div>
            </div>
          )}

          {scholarPassages.length > 0 && (
            <div className="pt-5 border-t border-border/80">
              <p className="war-label mb-1 text-foreground/85">Sources to Engage With</p>
              <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
              <SourcesList passages={scholarPassages} />
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function DesktopStandardSidebar({
  figureName,
  isUnlimitedDebate,
  scholarPassages,
  tips,
  hasKeyClaims,
  keyClaims,
  roundTrend,
  onEndDebate,
}: Pick<
  DebateSidebarProps,
  "figureName" | "isUnlimitedDebate" | "scholarPassages" | "tips" | "hasKeyClaims" | "keyClaims" | "roundTrend" | "onEndDebate"
>) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleConfirmEnd = async () => {
    setShowEndConfirm(false);
    await onEndDebate();
  };

  return (
    <aside className="hidden lg:flex flex-col gap-5 w-72 xl:w-80 shrink-0 border-l border-border pl-6 pt-2">
      {isUnlimitedDebate && (
        <div className="border border-foreground/10 bg-card/70 px-4 py-4 space-y-3">
          <p className="war-label text-foreground/85">Open-Ended Debate</p>
          <p className="text-sm text-muted-foreground leading-7">
            You control when this debate ends. Strike when you are ready to conclude - or keep going.
          </p>
          <Button
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            className="w-full justify-center bg-foreground text-background hover:bg-foreground/90 btn-press"
          >
            END DEBATE →
          </Button>
        </div>
      )}

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent className="sm:max-w-md arena-panel">
          <DialogHeader>
            <DialogTitle className="text-lg uppercase tracking-wider">
              End Debate?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-7">
              This will conclude the debate and calculate your final scores. You won&apos;t be able to submit more arguments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEndConfirm(false)}
              className="btn-press border-foreground/30"
            >
              CONTINUE DEBATING
            </Button>
            <Button
              onClick={handleConfirmEnd}
              className="btn-press bg-foreground text-background hover:bg-foreground/90 font-bold"
            >
              END DEBATE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {roundTrend.some((entry) => entry.score !== null) && (
        <div className="pt-5 border-t border-border/80">
          <p className="war-label mb-3 text-foreground/85">Round Trend</p>
          <div className="space-y-2.5">
            {roundTrend.map((entry) => (
              <div key={entry.turnNumber} className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground w-10">
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
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                  {entry.score !== null ? `${entry.score}/${MAX_SCORE}` : "--"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasKeyClaims && (
        <div className="pt-5 border-t border-border/80">
          <p className="war-label mb-3 text-foreground/85">{figureName.toUpperCase()} NOW ARGUES</p>
          <div className="space-y-3">
            {keyClaims.map((claim, index) => (
              <p key={index} className="text-sm text-muted-foreground leading-7">
                {claim}
              </p>
            ))}
          </div>
        </div>
      )}

      {scholarPassages.length > 0 && (
        <div className="pt-5 border-t border-border/80">
          <p className="war-label mb-1 text-foreground/85">Sources to Engage With</p>
          <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
          <SourcesList passages={scholarPassages} />
        </div>
      )}

      {tips.length > 0 && (
        <div className="border border-accent/20 border-l-2 border-l-accent/70 bg-card/70 px-4 py-4 space-y-2">
          {tips.map((tip, index) => (
            <p key={index} className="text-sm text-foreground/85 leading-7">
              • {tip}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}

function MobileSocraticHelpers({
  figureName,
  turns,
  currentPrompt,
  scholarPassages,
  socraticQuestionHistory,
  socraticAssumptionText,
  socraticSelfAwarenessTip,
}: Pick<
  DebateSidebarProps,
  "figureName" | "turns" | "currentPrompt" | "scholarPassages" | "socraticQuestionHistory" | "socraticAssumptionText" | "socraticSelfAwarenessTip"
>) {
  return (
    <div className="lg:hidden">
      <AccessibleDetails className="group/helpers">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
          <span className="group-open/helpers:rotate-90 transition-transform inline-block">▶</span>
          {turns.length === 0 ? "Dialogue guide" : "Dialogue notes"}
        </summary>
        <div className="mt-3 space-y-3">
          {turns.length === 0 ? (
            <>
              <div className="border border-accent/20 bg-accent/5 px-4 py-4">
                <p className="war-label text-accent mb-2">Socratic Dialogue</p>
                <p className="text-sm text-muted-foreground leading-7">
                  {figureName} will question you rather than argue. Answer directly, then examine what the question exposes.
                </p>
              </div>
              {currentPrompt && (
                <div className="p-4 border border-border">
                  <p className="war-label mb-2">The Question</p>
                  <p className="text-sm text-muted-foreground leading-7">{currentPrompt}</p>
                </div>
              )}
              <div className="p-4 border border-border">
                <p className="war-label mb-3">You Will Be Evaluated On</p>
                <div className="space-y-2 text-sm">
                  {[
                    ["Clarity", "How directly and precisely you answered"],
                    ["Depth", "Whether you probed beneath the obvious"],
                    ["Consistency", "Whether your answer holds together internally"],
                    ["Self-Awareness", "Whether you recognised what was being exposed"],
                  ].map(([label, description]) => (
                    <div key={label} className="flex gap-3 items-start">
                      <p className="w-24 shrink-0 text-accent text-xs uppercase tracking-[0.08em] pt-0.5">{label}</p>
                      <p className="text-xs text-muted-foreground leading-6">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
              {scholarPassages.length > 0 && (
                <div className="p-4 border border-border">
                  <p className="war-label mb-2">Sources to Engage With</p>
                  <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
                  <div className="space-y-3">
                    {scholarPassages.map((p, i) => (
                      <div key={i} className="pl-3 border-l-2 border-border">
                        <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {socraticQuestionHistory.length > 0 && (
                <div className="p-4 border border-border space-y-3">
                  <p className="war-label">Questions Posed So Far</p>
                  {socraticQuestionHistory.map((entry) => (
                    <div key={entry.exchangeNumber} className="border-l-2 border-l-accent/40 pl-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                        {turnLabel("socratic", entry.exchangeNumber)}
                        {entry.isCurrent ? " · Now" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground leading-7">
                        {compactText(entry.prompt, 110)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {socraticAssumptionText && (
                <div className="border border-accent/20 bg-accent/5 px-4 py-4">
                  <p className="war-label text-accent mb-2">Assumption Under Examination</p>
                  <p className="text-sm text-muted-foreground leading-7">{socraticAssumptionText}</p>
                </div>
              )}
              {socraticSelfAwarenessTip && (
                <div className="p-4 border border-border">
                  <p className="war-label mb-2">Self-Awareness Tip</p>
                  <p className="text-sm text-muted-foreground leading-7">{socraticSelfAwarenessTip}</p>
                </div>
              )}
              {scholarPassages.length > 0 && (
                <div className="p-4 border border-border">
                  <p className="war-label mb-2">Sources to Engage With</p>
                  <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
                  <div className="space-y-3">
                    {scholarPassages.map((p, i) => (
                      <div key={i} className="pl-3 border-l-2 border-border">
                        <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AccessibleDetails>
    </div>
  );
}

function MobileStandardHelpers({
  figureName,
  isUnlimitedDebate,
  scholarPassages,
  tips,
  hasKeyClaims,
  keyClaims,
  hasAnyHelper,
}: Pick<
  DebateSidebarProps,
  "figureName" | "isUnlimitedDebate" | "scholarPassages" | "tips" | "hasKeyClaims" | "keyClaims" | "hasAnyHelper"
>) {
  if (!hasAnyHelper && !isUnlimitedDebate) return null;

  return (
    <div className="lg:hidden">
      <AccessibleDetails className="group/helpers">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
          <span className="group-open/helpers:rotate-90 transition-transform inline-block">▶</span>
          Debate aids
          {tips.length > 0 && (
            <Badge variant="outline" className="text-xs ml-1 py-0 border-foreground/30 text-foreground/80">Tips</Badge>
          )}
        </summary>
        <div className="mt-3 space-y-3">
          {isUnlimitedDebate && (
            <div className="border border-foreground/10 bg-card/70 px-4 py-4">
              <p className="war-label mb-2">Open-Ended Debate</p>
              <p className="text-sm text-muted-foreground leading-7">
                You control when this debate ends. End it when you think the exchange has run its course.
              </p>
            </div>
          )}
          {scholarPassages.length > 0 && (
            <div className="mb-4 p-4 border border-border">
              <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">Sources to Engage With</p>
              <p className="text-xs text-muted-foreground mb-3">Review these passages before responding.</p>
              <div className="space-y-3">
                {scholarPassages.map((p, i) => (
                  <div key={i} className="pl-3 border-l-2 border-border">
                    <p className="text-xs font-medium text-foreground/80">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{p.text_excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tips.length > 0 && (
            <div className="mb-4 p-3 bg-secondary/25 border border-border/50 border-l-2 border-l-accent/60">
              {tips.map((t, i) => (
                <p key={i} className="text-sm text-foreground/85">• {t}</p>
              ))}
            </div>
          )}
          {hasKeyClaims && (
            <div className="p-4 border-l-4 border-accent/50 bg-secondary/20 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">
                {figureName} argues
              </p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1.5 pl-1">
                {keyClaims.map((c, i) => (
                  <li key={i} className="leading-relaxed">{c}</li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground mt-3 italic">How do you respond to these points?</p>
            </div>
          )}
        </div>
      </AccessibleDetails>
    </div>
  );
}

export function DebateSidebar(props: DebateSidebarProps) {
  if (props.variant === "mobile") {
    if (props.isSocratic) {
      return (
        <MobileSocraticHelpers
          figureName={props.figureName}
          turns={props.turns}
          currentPrompt={props.currentPrompt}
          scholarPassages={props.scholarPassages}
          socraticQuestionHistory={props.socraticQuestionHistory}
          socraticAssumptionText={props.socraticAssumptionText}
          socraticSelfAwarenessTip={props.socraticSelfAwarenessTip}
        />
      );
    }
    return (
      <MobileStandardHelpers
        figureName={props.figureName}
        isUnlimitedDebate={props.isUnlimitedDebate}
        scholarPassages={props.scholarPassages}
        tips={props.tips}
        hasKeyClaims={props.hasKeyClaims}
        keyClaims={props.keyClaims}
        hasAnyHelper={props.hasAnyHelper}
      />
    );
  }

  if (props.isSocratic) {
    return (
      <DesktopSocraticSidebar
        figureName={props.figureName}
        turns={props.turns}
        currentPrompt={props.currentPrompt}
        scholarPassages={props.scholarPassages}
        socraticQuestionHistory={props.socraticQuestionHistory}
        socraticAssumptionText={props.socraticAssumptionText}
        socraticSelfAwarenessTip={props.socraticSelfAwarenessTip}
      />
    );
  }
  return (
    <DesktopStandardSidebar
      figureName={props.figureName}
      isUnlimitedDebate={props.isUnlimitedDebate}
      scholarPassages={props.scholarPassages}
      tips={props.tips}
      hasKeyClaims={props.hasKeyClaims}
      keyClaims={props.keyClaims}
      roundTrend={props.roundTrend}
      onEndDebate={props.onEndDebate}
    />
  );
}
