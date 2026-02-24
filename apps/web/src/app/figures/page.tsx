"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
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
import { getFigureDebateCount } from "@/lib/progression";
import type { DebateTopic, FigureInfo } from "@/lib/types";
import {
  ERA_CATEGORIES,
  filterFiguresByEra,
  type EraCategory,
} from "@/lib/figures";

export default function FiguresPage() {
  const figures = useDebateStore((s) => s.figures);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
  const clearSelections = useDebateStore((s) => s.clearSelections);
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPassages, setPreviewPassages] = useState<Array<{ source_id: string; title: string; text_excerpt: string }>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [selectedEra, setSelectedEra] = useState<EraCategory>("All");
  const [highlightedFigureId, setHighlightedFigureId] = useState<string | null>(null);
  const [highlightedTopicId, setHighlightedTopicId] = useState<string | null>(null);
  const [selectionsInitialized, setSelectionsInitialized] = useState(false);
  const activeSelectedFigure = selectionsInitialized ? selectedFigure : null;
  const activeSelectedTopic = selectionsInitialized ? selectedTopic : null;
  const selectedFigureId = activeSelectedFigure?.id;
  const selectedTopicId = activeSelectedTopic?.id;

  const filteredFigures = filterFiguresByEra(figures, selectedEra);

  useEffect(() => {
    setVisibleCount(4);
  }, [selectedEra]);

  const topicSectionRef = useRef<HTMLDivElement>(null);
  const settingsSectionRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (figures.length === 0) {
      fetchFigures();
    }
  }, [figures.length, fetchFigures]);

  useEffect(() => {
    clearSelections();
    setHighlightedFigureId(null);
    setHighlightedTopicId(null);
    setSelectionsInitialized(true);
  }, [clearSelections]);

  useEffect(() => {
    if (activeSelectedFigure) {
      topicSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSelectedFigure]);

  useEffect(() => {
    if (activeSelectedFigure && activeSelectedTopic) {
      settingsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSelectedFigure, activeSelectedTopic]);

  useEffect(() => {
    if (selectedFigureId && selectedTopicId) {
      void prefetchTopicPrimer();
    }
  }, [selectedFigureId, selectedTopicId, prefetchTopicPrimer]);

  const handleFigureClick = (figure: FigureInfo) => {
    if (activeSelectedFigure?.id === figure.id) return;
    if (highlightedFigureId === figure.id) {
      setHighlightedFigureId(null);
      setHighlightedTopicId(null);
      selectFigure(figure);
    } else {
      setHighlightedFigureId(figure.id);
      setHighlightedTopicId(null);
    }
  };

  const handleTopicClick = (topic: DebateTopic) => {
    if (!activeSelectedFigure) return;
    if (activeSelectedTopic?.id === topic.id) return;
    if (highlightedTopicId === topic.id) {
      setHighlightedTopicId(null);
      selectTopic(topic);
    } else {
      setHighlightedTopicId(topic.id);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">
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
          <p className="war-label mb-3">// SELECT YOUR ADVERSARY</p>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] mb-3 sm:mb-4">
            CHOOSE YOUR
            <br />
            <span className="text-muted-foreground">OPPONENT</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-md">
            Each has centuries of wisdom. You have your wits. Select wisely.
          </p>
          <div className="arena-divider mt-6">
            <Swords size={16} className="text-muted-foreground/40" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start max-w-5xl mx-auto">
          {ERA_CATEGORIES.map((era) => (
            <button
              key={era}
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
            const isHighlighted = highlightedFigureId === figure.id;
            return (
            <Card
              key={figure.id}
              onClick={() => handleFigureClick(figure)}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] group overflow-hidden rounded-xl shadow-lg hover:shadow-xl arena-texture ${
                isSelected
                  ? "bg-foreground text-background border-foreground shadow-lg arena-pulse"
                  : isHighlighted
                  ? "bg-secondary/70 backdrop-blur-sm border-2 border-foreground/50 shadow-lg"
                  : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
              }`}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-blackletter font-bold text-lg sm:text-xl shrink-0 ${
                    isSelected
                      ? "bg-background text-foreground"
                      : isHighlighted
                      ? "bg-foreground/20 text-foreground"
                      : "bg-foreground text-background"
                  }`}>
                    {figure.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-base sm:text-lg tracking-tight truncate">
                        {figure.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-xs sm:text-sm ${
                        isSelected ? "text-background/70" : isHighlighted ? "text-foreground/80" : "text-muted-foreground"
                      }`}>
                        {figure.era}
                      </p>
                      {getFigureDebateCount(figure.id) > 0 && (
                        <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-foreground/20 text-foreground/90">
                          {getFigureDebateCount(figure.id)} debate{getFigureDebateCount(figure.id) !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm line-clamp-3 mb-4 leading-relaxed ${
                      isSelected ? "text-background/80" : isHighlighted ? "text-foreground/90" : "text-muted-foreground"
                    }`}>
                      {figure.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {figure.traits.slice(0, 4).map((trait) => (
                        <span
                          key={trait}
                          className={`px-2.5 py-1 text-[10px] sm:text-xs rounded-full ${
                            isSelected
                              ? "bg-background/20 text-background"
                              : isHighlighted
                              ? "bg-foreground/20 text-foreground"
                              : "bg-foreground/10 text-foreground/80"
                          }`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    isSelected
                      ? "border-background bg-background"
                      : isHighlighted
                      ? "border-foreground/60"
                      : "border-foreground/30"
                  }`}>
                    {isSelected && (
                      <span className="text-foreground text-xs">✓</span>
                    )}
                    {isHighlighted && !isSelected && (
                      <span className="text-foreground/60 text-xs">·</span>
                    )}
                  </div>
                </div>
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
              onClick={() => setVisibleCount((c) => c + 4)}
              className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press px-6 sm:px-8 py-4 sm:py-5 h-auto"
            >
              <Swords size={24} strokeWidth={1.5} className="shrink-0 sm:w-7 sm:h-7" />
            </Button>
          </div>
        )}

        {activeSelectedFigure && (
          <div ref={topicSectionRef} className="max-w-3xl mx-auto arena-enter">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2">// CHOOSE YOUR BATTLEFIELD</p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tighter mb-2">
                SELECT A TOPIC
              </h3>
              <p className="text-sm text-muted-foreground">What ground will you fight on?</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {activeSelectedFigure.topics.map((topic) => {
                const isTopicSelected = activeSelectedTopic?.id === topic.id;
                const isTopicHighlighted = highlightedTopicId === topic.id;
                return (
                <Card
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    isTopicSelected
                      ? "bg-foreground text-background border-foreground"
                      : isTopicHighlighted
                      ? "bg-secondary/70 backdrop-blur-sm border-2 border-foreground/50"
                      : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-blackletter text-xs font-bold shrink-0 ${
                        isTopicSelected
                          ? "bg-background text-foreground"
                          : isTopicHighlighted
                          ? "bg-foreground/20 text-foreground"
                          : "bg-foreground/10 text-foreground"
                      }`}>
                        {activeSelectedFigure.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {topic.title}
                        </h4>
                        {topic.description && (
                          <p className={`text-xs line-clamp-2 ${isTopicSelected ? "text-background/70" : isTopicHighlighted ? "text-foreground/90" : "text-muted-foreground"}`}>
                            {topic.description}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isTopicSelected
                          ? "border-background bg-background"
                          : isTopicHighlighted
                          ? "border-foreground/60"
                          : "border-foreground/30"
                      }`}>
                        {isTopicSelected && (
                          <span className="text-foreground text-xs">✓</span>
                        )}
                        {isTopicHighlighted && !isTopicSelected && (
                          <span className="text-foreground/60 text-xs">·</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </div>
        )}

        {activeSelectedFigure && activeSelectedTopic && (
          <div ref={settingsSectionRef} className="max-w-2xl mx-auto arena-enter">
            <div className="mb-8">
              <div className="arena-divider">
                <Swords size={14} className="text-muted-foreground/40" />
              </div>
              <p className="war-label mb-2">// CONFIGURE YOUR BATTLE</p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tighter mb-6">
                SETTINGS
              </h3>
              
              <Card className="border-2 contrast-border">
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-medium mb-3">MODE</label>
                      <div className="flex gap-2">
                        <Button
                          variant={debateMode === "structured" ? "default" : "outline"}
                          onClick={() => setDebateMode("structured")}
                          className={`flex-1 btn-press ${debateMode === "structured" ? "bg-foreground text-background" : ""}`}
                        >
                          {debateMode === "structured" ? "✓" : ""} STRUCTURED
                        </Button>
                        <Button
                          variant={debateMode === "freeform" ? "default" : "outline"}
                          onClick={() => setDebateMode("freeform")}
                          className={`flex-1 btn-press ${debateMode === "freeform" ? "bg-foreground text-background" : ""}`}
                        >
                          {debateMode === "freeform" ? "✓" : ""} FREEFORM
                        </Button>
                      </div>
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
                          onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                          className="w-full accent-foreground"
                        />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">SCHOLAR MODE</label>
                      <Button
                        variant={scholarMode ? "default" : "outline"}
                        onClick={() => setScholarMode(!scholarMode)}
                        size="sm"
                        className={scholarMode ? "bg-foreground text-background" : ""}
                      >
                        {scholarMode ? "✓ " : ""}Show sources before each reply
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
              <Dialog open={previewOpen} onOpenChange={(open) => { setPreviewOpen(open); if (open) fetchPreview(); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="text-sm sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto btn-press w-full sm:w-auto">
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
                      {previewPassages.map((p, i) => (
                        <Card key={i} className="border-2 contrast-border">
                          <CardContent className="p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{p.title}</p>
                            <p className="text-sm whitespace-pre-wrap">{p.text_excerpt}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No passages available for this topic.</p>
                  )}
                </DialogContent>
              </Dialog>
              <Link href="/debate" className="w-full sm:w-auto">
                <Button size="lg" className="text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press w-full sm:w-auto">
                  START DEBATE →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
