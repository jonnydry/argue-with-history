"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebateStore } from "@/stores/debate-store";
import { api } from "@/lib/api";
import {
  getProgressionSnapshot,
  subscribeToProgression,
  type ProgressionData,
} from "@/lib/progression";
import type { DebateTopic, FigureInfo } from "@/lib/types";
import {
  ERA_CATEGORIES,
  filterFiguresByEra,
  type EraCategory,
} from "@/lib/figures";

type PreviewPassage = {
  source_id: string;
  title: string;
  text_excerpt: string;
};

const emptyProgression: ProgressionData = { byFigure: {}, byFigureTopic: {} };

export default function FiguresPage() {
  const figures = useDebateStore((s) => s.figures);
  const currentDebate = useDebateStore((s) => s.currentDebate);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
  const restoreDebateIfNeeded = useDebateStore((s) => s.restoreDebateIfNeeded);
  const selectFigure = useDebateStore((s) => s.selectFigure);
  const selectedFigure = useDebateStore((s) => s.selectedFigure);
  const selectTopic = useDebateStore((s) => s.selectTopic);
  const selectedTopic = useDebateStore((s) => s.selectedTopic);
  const prefetchTopicPrimer = useDebateStore((s) => s.prefetchTopicPrimer);
  const debateMode = useDebateStore((s) => s.debateMode);
  const setDebateMode = useDebateStore((s) => s.setDebateMode);
  const maxTurns = useDebateStore((s) => s.maxTurns);
  const setMaxTurns = useDebateStore((s) => s.setMaxTurns);
  const scholarMode = useDebateStore((s) => s.scholarMode);
  const setScholarMode = useDebateStore((s) => s.setScholarMode);
  const deleteCurrentDebate = useDebateStore((s) => s.deleteCurrentDebate);
  const isLoading = useDebateStore((s) => s.isLoading);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPassages, setPreviewPassages] = useState<PreviewPassage[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedEra, setSelectedEra] = useState<EraCategory>("All");
  const progression = useSyncExternalStore(
    subscribeToProgression,
    getProgressionSnapshot,
    () => emptyProgression
  );

  const topicSectionRef = useRef<HTMLDivElement>(null);
  const settingsSectionRef = useRef<HTMLDivElement>(null);

  const activeSelectedFigure = selectedFigure;
  const activeSelectedTopic = selectedTopic;
  const filteredFigures = filterFiguresByEra(figures, selectedEra);

  useEffect(() => {
    void fetchFigures();
    void restoreDebateIfNeeded();
  }, [fetchFigures, restoreDebateIfNeeded]);

  useEffect(() => {
    if (activeSelectedFigure && activeSelectedTopic) {
      void prefetchTopicPrimer();
    }
  }, [activeSelectedFigure, activeSelectedTopic, prefetchTopicPrimer]);

  useEffect(() => {
    setVisibleCount(6);
  }, [selectedEra]);

  const fetchPreview = async () => {
    if (!activeSelectedFigure || !activeSelectedTopic) return;
    setPreviewLoading(true);
    try {
      const res = await api.figures.getTopicPreview(
        activeSelectedFigure.id,
        activeSelectedTopic.id
      );
      setPreviewPassages(res.passages);
    } catch {
      setPreviewPassages([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const openPreviewDialog = async () => {
    setPreviewOpen(true);
    await fetchPreview();
  };

  const scrollToTopics = () => {
    topicSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFigureSelect = (figure: FigureInfo) => {
    if (activeSelectedFigure?.id === figure.id) return;
    selectFigure(figure);
  };

  const handleTopicSelect = (topic: DebateTopic) => {
    if (activeSelectedTopic?.id === topic.id) return;
    selectTopic(topic);
  };

  const hasIncompleteDebate = currentDebate?.status === "active";
  const incompleteDebateFigure = hasIncompleteDebate
    ? figures.find((figure) => figure.id === currentDebate.figure)
    : null;
  const figureDisplayName =
    incompleteDebateFigure?.name ??
    (currentDebate?.figure
      ? String(currentDebate.figure).charAt(0).toUpperCase() +
        String(currentDebate.figure).slice(1)
      : "");

  const showBottomBar = activeSelectedFigure != null;
  const hasFixedTurns = debateMode === "debate" && maxTurns > 0;
  const savedDebateProgress = currentDebate
    ? currentDebate.current_turn > 0
      ? currentDebate.mode === "socratic"
        ? `Exchange ${currentDebate.current_turn}`
        : currentDebate.max_turns > 0
          ? `Turn ${currentDebate.current_turn}/${currentDebate.max_turns}`
          : `Turn ${currentDebate.current_turn}`
      : "Ready to resume"
    : "";
  const settingsSummary = [
    debateMode === "socratic" ? "Socratic" : "Debate",
    debateMode === "debate" ? (hasFixedTurns ? `${maxTurns} turns` : "Open-ended") : null,
    scholarMode ? "Scholar mode" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg relative">
      {hasIncompleteDebate && (
        <aside
          className="fixed top-4 right-4 z-30 w-64 sm:w-72 arena-enter"
          aria-label="Incomplete debate"
        >
          <Card className="arena-panel border-accent/40 overflow-hidden relative">
            <button
              type="button"
              onClick={() => void deleteCurrentDebate()}
              aria-label="Delete saved debate"
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors z-10"
            >
              <X size={14} />
            </button>
            <Link href="/debate">
              <CardContent className="p-4 hover:bg-accent/5 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Swords size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Saved debate
                    </p>
                    <p className="font-semibold text-sm truncate" title={figureDisplayName}>
                      {figureDisplayName}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {currentDebate.topic}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                      {savedDebateProgress}
                    </p>
                    <p className="text-xs text-accent font-medium mt-2 group-hover:underline">
                      Resume
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </aside>
      )}

      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-4">
            <Swords size={20} strokeWidth={1.5} className="shrink-0 sm:w-6 sm:h-6" />
            <h1 className="text-base sm:text-xl font-bold tracking-tight">
              ARGUE WITH HISTORY
            </h1>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-medium">
              HOME
            </Button>
          </Link>
        </div>
      </header>

      <main className={`container mx-auto px-4 sm:px-6 py-8 sm:py-12 ${showBottomBar ? "pb-28" : ""}`}>
        {/* Hero */}
        <div className="mb-8 sm:mb-12 arena-enter">
          <p className="war-label mb-3">ENTER THE ARENA</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">
            <h2 className="editorial-display text-5xl sm:text-6xl md:text-7xl leading-[0.92]">
              CHOOSE YOUR
              <br />
              <span className="headline-emphasis">OPPONENT.</span>
            </h2>
            <div className="lg:pb-2 max-w-sm">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Select a historical figure to debate. Click to learn more,
                then pick a topic and configure your match.
              </p>
              <p className="text-xs text-foreground/30 mt-1">
                {figures.length}+ figures across 5 eras
              </p>
            </div>
          </div>
        </div>

        {/* Era filters — horizontal scroll on mobile, wrap on sm+ */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-start pb-1 sm:pb-0">
          {ERA_CATEGORIES.map((era) => {
            const mobileLabel =
              era === "Renaissance / Early Modern"
                ? "Renaissance"
                : era === "19th–20th Century"
                  ? "19th–20th"
                  : era;
            return (
              <button
                key={era}
                type="button"
                onClick={() => setSelectedEra(era)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                  selectedEra === era
                    ? "bg-foreground text-background"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
                }`}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{era}</span>
              </button>
            );
          })}
        </div>

        {/* Figure grid — 3 columns on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredFigures.slice(0, visibleCount).map((figure) => {
            const isSelected = activeSelectedFigure?.id === figure.id;
            const debateCount = progression.byFigure[figure.id] ?? 0;

            return (
              <Card
                key={figure.id}
                className={`overflow-hidden rounded-xl arena-texture transition-all duration-300 ${
                  isSelected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleFigureSelect(figure)}
                  aria-pressed={isSelected}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-blackletter font-bold text-lg shrink-0 ${
                          isSelected
                            ? "bg-background text-foreground"
                            : "bg-foreground text-background"
                        }`}
                      >
                        {figure.name.charAt(0)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-base tracking-tight truncate">
                            {figure.name}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {debateCount > 0 && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  isSelected
                                    ? "bg-background/12 text-background border border-background/20"
                                    : "bg-foreground/10 text-foreground/70"
                                }`}
                              >
                                {debateCount} debate{debateCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            <span
                              className={`text-[10px] uppercase tracking-[0.18em] ${
                                isSelected ? "text-accent/90" : "text-accent/60"
                              }`}
                            >
                              {figure.era.split("(")[0].trim()}
                            </span>
                          </div>
                        </div>

                        <p
                          className={`text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed ${
                            isSelected ? "text-background/75" : "text-muted-foreground"
                          }`}
                        >
                          {figure.description}
                        </p>
                      </div>

                      {/* Select indicator — top right */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "border-background bg-background"
                            : "border-foreground/20"
                        }`}
                      >
                        {isSelected && <span className="text-foreground text-[10px]">✓</span>}
                      </div>
                    </div>

                    {/* Trait pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {figure.traits.slice(0, 4).map((trait) => (
                        <span
                          key={trait}
                          className={`px-2.5 py-0.5 text-[10px] sm:text-[11px] rounded-full ${
                            isSelected
                              ? "bg-background/15 text-background/80"
                              : "bg-foreground/[0.06] text-foreground/60"
                          }`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </button>
              </Card>
            );
          })}
        </div>

        {/* Load more — only when "All" is selected */}
        {selectedEra === "All" && filteredFigures.length > visibleCount && (
          <div className="flex justify-center mb-10 sm:mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((count) => count + 6)}
              className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press px-6 sm:px-8 py-4 sm:py-5 h-auto gap-2"
            >
              <Swords size={20} strokeWidth={1.5} />
              <span className="uppercase tracking-wider font-medium">Load more</span>
            </Button>
          </div>
        )}

        {/* Topic section */}
        {activeSelectedFigure && (
          <div ref={topicSectionRef} className="max-w-3xl mx-auto arena-enter scroll-mt-24">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2">SELECT A TOPIC</p>
              <h3 className="editorial-section-title text-2xl sm:text-3xl mb-2">
                CHOOSE YOUR BATTLEFIELD
              </h3>
              <p className="text-sm text-muted-foreground">
                Pick what you want to argue about with {activeSelectedFigure.name}.
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {activeSelectedFigure.topics.map((topic) => {
                const isTopicSelected = activeSelectedTopic?.id === topic.id;

                return (
                  <Card
                    key={topic.id}
                    className={`overflow-hidden rounded-xl arena-texture transition-all duration-300 ${
                      isTopicSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTopicSelect(topic)}
                      aria-pressed={isTopicSelected}
                      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3.5">
                          {/* Avatar */}
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-blackletter font-bold text-lg shrink-0 ${
                              isTopicSelected
                                ? "bg-background text-foreground"
                                : "bg-foreground text-background"
                            }`}
                          >
                            {activeSelectedFigure.name.charAt(0)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-base tracking-tight">
                                {topic.title}
                              </h4>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                  isTopicSelected
                                    ? "border-background bg-background"
                                    : "border-foreground/20"
                                }`}
                              >
                                {isTopicSelected && (
                                  <span className="text-foreground text-[10px]">✓</span>
                                )}
                              </div>
                            </div>
                            {topic.description && (
                              <p
                                className={`text-sm leading-relaxed mt-1 ${
                                  isTopicSelected ? "text-background/75" : "text-muted-foreground"
                                }`}
                              >
                                {topic.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings section — appears after topic selected */}
        {activeSelectedFigure && activeSelectedTopic && (
          <div ref={settingsSectionRef} className="max-w-2xl mx-auto arena-enter scroll-mt-24">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2">CONFIGURE YOUR BATTLE</p>
              <h3 className="editorial-section-title text-2xl sm:text-3xl mb-6">
                SETTINGS
              </h3>

              <Card className="arena-panel">
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                        Debate Mode
                      </label>
                      <div className="flex flex-col gap-2">
                        {(
                          [
                            {
                              value: "socratic",
                              label: "Socratic",
                              description: "The figure questions you. Defend your positions.",
                            },
                            {
                              value: "debate",
                              label: "Debate",
                              description: "Argue against the figure's own defense.",
                            },
                          ] as const
                        ).map(({ value, label, description }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDebateMode(value)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                              debateMode === value
                                ? "border-foreground bg-foreground/[0.08]"
                                : "border-border/50 hover:border-foreground/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{label}</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  debateMode === value
                                    ? "border-foreground bg-foreground"
                                    : "border-foreground/20"
                                }`}
                              >
                                {debateMode === value && (
                                  <span className="text-background text-[8px] font-bold">✓</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                     {debateMode === "debate" && (
                       <div>
                         <label className="block text-sm font-medium mb-2">FIXED TURNS</label>
                         <Button
                           variant={hasFixedTurns ? "default" : "outline"}
                           onClick={() => setMaxTurns(hasFixedTurns ? 0 : 3)}
                           size="sm"
                           className={hasFixedTurns ? "bg-foreground text-background" : ""}
                         >
                           {hasFixedTurns ? "✓ " : ""}
                           {hasFixedTurns ? "On" : "Off"}
                         </Button>
                         <p className="text-xs text-muted-foreground mt-1">
                           Turn this off for an open-ended debate you end manually.
                         </p>

                         {hasFixedTurns && (
                           <>
                             <label className="block text-sm font-medium mt-4 mb-3">
                               TURNS: {maxTurns}
                             </label>
                             <input
                               type="range"
                               min={2}
                               max={6}
                               value={maxTurns}
                               onChange={(event) => setMaxTurns(parseInt(event.target.value, 10))}
                               title={`${maxTurns} exchange${maxTurns !== 1 ? "s" : ""} total`}
                               className="w-full accent-foreground"
                             />
                             <p className="text-xs text-muted-foreground mt-1">
                               Number of back-and-forth exchanges.
                             </p>
                           </>
                         )}
                       </div>
                     )}

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">SCHOLAR MODE</label>
                      <Button
                        variant={scholarMode ? "default" : "outline"}
                        onClick={() => setScholarMode(!scholarMode)}
                        size="sm"
                        title="Show key passages before you respond so you can cite them."
                        className={scholarMode ? "bg-foreground text-background" : ""}
                      >
                        {scholarMode ? "✓ " : ""}
                        Show sources before each reply
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sources appear prominently above the input so you can engage with the texts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preview dialog */}
        {activeSelectedFigure && activeSelectedTopic && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Key passages for this topic</DialogTitle>
              </DialogHeader>
              {previewLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : previewPassages.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {previewPassages.map((passage) => (
                    <Card key={`${passage.source_id}-${passage.title}`} className="arena-panel">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {passage.title}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{passage.text_excerpt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No passages available for this topic.</p>
              )}
            </DialogContent>
          </Dialog>
        )}
      </main>

      {/* Sticky bottom bar */}
      {showBottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-foreground/10 bg-background/92 backdrop-blur-md arena-enter">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-blackletter text-base font-bold shrink-0">
                {activeSelectedFigure.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm sm:text-base truncate">
                  {activeSelectedFigure.name}
                </p>
                {activeSelectedTopic && (
                  <p className="text-xs text-muted-foreground truncate">
                    {activeSelectedTopic.title}
                  </p>
                )}
              </div>
              {activeSelectedTopic && (
                <>
                  <div className="hidden sm:block w-px h-7 bg-foreground/10" />
                  <span className="hidden sm:block text-xs text-foreground/40">
                    {settingsSummary}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {!activeSelectedTopic ? (
                <Button onClick={scrollToTopics} className="btn-press text-sm">
                  <span className="sm:hidden">Topics →</span>
                  <span className="hidden sm:inline">Continue to topics</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-press hidden sm:inline-flex"
                    onClick={() => void openPreviewDialog()}
                  >
                    Preview sources
                  </Button>
                  <Link href="/debate">
                    <Button
                      size="sm"
                      className="bg-foreground text-background hover:bg-foreground/90 btn-press"
                    >
                      {isLoading ? "PREPARING..." : "Start Debate"}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
