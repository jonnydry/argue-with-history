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
  DialogTrigger,
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
import { FigureLoadedTexts } from "@/components/figure-loaded-texts";

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

  const scrollToTopics = () => {
    topicSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSettings = () => {
    settingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                      Round {currentDebate.current_turn}/{currentDebate.max_turns}
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

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12 arena-enter">
          <p className="war-label mb-3"><span aria-hidden="true">&sol;&sol; </span>SELECT YOUR ADVERSARY</p>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-3 sm:mb-4">
            CHOOSE YOUR
            <br />
            <span className="headline-emphasis">OPPONENT</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-lg">
            Single-click to select an opponent, then continue when you are ready. Browsing should feel exploratory, not jumpy.
          </p>
          <div className="arena-divider mt-6">
            <Swords size={16} className="text-muted-foreground/40" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start max-w-5xl mx-auto">
          {ERA_CATEGORIES.map((era) => (
            <button
              key={era}
              type="button"
              onClick={() => setSelectedEra(era)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedEra === era
                  ? "bg-foreground text-background"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
              }`}
            >
              {era}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto mb-6">
          {filteredFigures.slice(0, visibleCount).map((figure) => {
            const isSelected = activeSelectedFigure?.id === figure.id;
            const debateCount = progression.byFigure[figure.id] ?? 0;

            return (
              <Card
                key={figure.id}
                className={`overflow-hidden rounded-xl shadow-lg hover:shadow-xl arena-texture transition-all duration-300 ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-lg"
                    : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleFigureSelect(figure)}
                  aria-pressed={isSelected}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-blackletter font-bold text-lg sm:text-xl shrink-0 ${
                          isSelected
                            ? "bg-background text-foreground"
                            : "bg-foreground text-background"
                        }`}
                      >
                        {figure.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-base sm:text-lg tracking-tight truncate">
                            {figure.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p
                            className={`text-xs sm:text-sm ${
                              isSelected ? "text-background/70" : "text-muted-foreground"
                            }`}
                          >
                            {figure.era}
                          </p>
                          {debateCount > 0 && (
                            <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-foreground/20 text-foreground/90">
                              {debateCount} debate{debateCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm line-clamp-3 mb-4 leading-relaxed ${
                            isSelected ? "text-background/80" : "text-muted-foreground"
                          }`}
                        >
                          {figure.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {figure.traits.slice(0, 4).map((trait) => (
                            <span
                              key={trait}
                              className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-full ${
                                isSelected
                                  ? "bg-background/20 text-background"
                                  : "bg-foreground/10 text-foreground/80"
                              }`}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                          isSelected
                            ? "border-background bg-background"
                            : "border-foreground/30"
                        }`}
                      >
                        {isSelected && <span className="text-foreground text-xs">✓</span>}
                      </div>
                    </div>
                  </CardContent>
                </button>
                <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <FigureLoadedTexts
                    figureId={figure.id}
                    variant={isSelected ? "selected" : "default"}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredFigures.length > visibleCount && (
          <div className="flex justify-center mb-10 sm:mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((count) => count + 6)}
              className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press px-6 sm:px-8 py-4 sm:py-5 h-auto gap-2"
            >
              <Swords size={24} strokeWidth={1.5} className="shrink-0 sm:w-7 sm:h-7" />
              <span className="uppercase tracking-wider font-medium">Load more</span>
            </Button>
          </div>
        )}

        {activeSelectedFigure && (
          <Card className="max-w-5xl mx-auto mb-8 arena-panel border-accent/20">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Opponent Selected
                </p>
                <p className="text-lg font-semibold">{activeSelectedFigure.name}</p>
                <p className="text-sm text-muted-foreground">
                  Browse topics below, or jump there when you are ready.
                </p>
              </div>
              <Button onClick={scrollToTopics} className="btn-press sm:min-w-48">
                Continue to topics
              </Button>
            </CardContent>
          </Card>
        )}

        {activeSelectedFigure && (
          <div ref={topicSectionRef} className="max-w-3xl mx-auto arena-enter scroll-mt-24">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2"><span aria-hidden="true">&sol;&sol; </span>CHOOSE YOUR BATTLEFIELD</p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tighter mb-2">
                SELECT A TOPIC
              </h3>
              <p className="text-sm text-muted-foreground">
                Single-click selects a topic. We only move the page when you ask us to.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {activeSelectedFigure.topics.map((topic) => {
                const isTopicSelected = activeSelectedTopic?.id === topic.id;

                return (
                  <Card
                    key={topic.id}
                    className={`overflow-hidden transition-all duration-300 ${
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
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-blackletter text-xs font-bold shrink-0 ${
                              isTopicSelected
                                ? "bg-background text-foreground"
                                : "bg-foreground/10 text-foreground"
                            }`}
                          >
                            {activeSelectedFigure.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1">{topic.title}</h4>
                            {topic.description && (
                              <p
                                className={`text-xs line-clamp-2 ${
                                  isTopicSelected
                                    ? "text-background/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {topic.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isTopicSelected
                                ? "border-background bg-background"
                                : "border-foreground/30"
                            }`}
                          >
                            {isTopicSelected && (
                              <span className="text-foreground text-xs">✓</span>
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

        {activeSelectedFigure && activeSelectedTopic && (
          <Card className="max-w-3xl mx-auto mb-8 arena-panel border-accent/20">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  Topic Selected
                </p>
                <p className="text-lg font-semibold">{activeSelectedTopic.title}</p>
                <p className="text-sm text-muted-foreground">
                  Preview the source material or keep moving into debate settings.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Dialog
                  open={previewOpen}
                  onOpenChange={(open) => {
                    setPreviewOpen(open);
                    if (open) void fetchPreview();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="btn-press">
                      Preview sources
                    </Button>
                  </DialogTrigger>
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
                              <p className="text-sm whitespace-pre-wrap">
                                {passage.text_excerpt}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No passages available for this topic.
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
                <Button onClick={scrollToSettings} className="btn-press">
                  Continue to settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSelectedFigure && activeSelectedTopic && (
          <div ref={settingsSectionRef} className="max-w-2xl mx-auto arena-enter scroll-mt-24">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2"><span aria-hidden="true">&sol;&sol; </span>CONFIGURE YOUR BATTLE</p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tighter mb-6">
                SETTINGS
              </h3>

              <Card className="arena-panel">
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium mb-3">MODE</label>
                      <div className="flex gap-2">
                        <Button
                          variant={debateMode === "structured" ? "default" : "outline"}
                          onClick={() => setDebateMode("structured")}
                          title="Fixed number of turns. Good for focused practice."
                          className={`flex-1 btn-press ${
                            debateMode === "structured" ? "bg-foreground text-background" : ""
                          }`}
                        >
                          {debateMode === "structured" ? "✓ " : ""}
                          STRUCTURED
                        </Button>
                        <Button
                          variant={debateMode === "freeform" ? "default" : "outline"}
                          onClick={() => setDebateMode("freeform")}
                          title="Open-ended. Continue until you end the debate."
                          className={`flex-1 btn-press ${
                            debateMode === "freeform" ? "bg-foreground text-background" : ""
                          }`}
                        >
                          {debateMode === "freeform" ? "✓ " : ""}
                          FREEFORM
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {debateMode === "structured"
                          ? "Turn-limited debate with clear rounds."
                          : "Open-ended debate. End when you choose."}
                      </p>
                    </div>

                    {debateMode === "structured" && (
                      <div>
                        <label className="block text-sm font-medium mb-3">
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

            <div className="text-center flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Dialog
                open={previewOpen}
                onOpenChange={(open) => {
                  setPreviewOpen(open);
                  if (open) void fetchPreview();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto btn-press w-full sm:w-auto"
                  >
                    PREVIEW SOURCES
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Key passages for this topic</DialogTitle>
                  </DialogHeader>
                  {previewLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : previewPassages.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {previewPassages.map((passage) => (
                        <Card key={`${passage.source_id}-${passage.title}-settings`} className="arena-panel">
                          <CardContent className="p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {passage.title}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {passage.text_excerpt}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No passages available for this topic.
                    </p>
                  )}
                </DialogContent>
              </Dialog>
              <Link href="/debate" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press w-full sm:w-auto"
                >
                  {isLoading ? "PREPARING..." : "START DEBATE"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
