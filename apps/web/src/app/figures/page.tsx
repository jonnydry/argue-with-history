"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function FiguresPage() {
  const figures = useDebateStore((s) => s.figures);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
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
  const [visibleCount, setVisibleCount] = useState(8);

  const topicSectionRef = useRef<HTMLDivElement>(null);
  const settingsSectionRef = useRef<HTMLDivElement>(null);

  const fetchPreview = async () => {
    if (!selectedFigure || !selectedTopic) return;
    setPreviewLoading(true);
    try {
      const res = await api.figures.getTopicPreview(selectedFigure.id, selectedTopic.id);
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
    if (selectedFigure) {
      topicSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedFigure]);

  useEffect(() => {
    if (selectedFigure && selectedTopic) {
      settingsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedFigure, selectedTopic]);

  useEffect(() => {
    if (selectedFigure && selectedTopic) {
      prefetchTopicPrimer();
    }
  }, [selectedFigure?.id, selectedTopic?.id, prefetchTopicPrimer]);

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
        <div className="mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 sm:mb-3">
            CHOOSE YOUR
            <br />
            OPPONENT
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Select wisely. Your arguments will be tested.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-5xl mx-auto mb-6">
          {figures.slice(0, visibleCount).map((figure) => (
            <Card
              key={figure.id}
              onClick={() => selectFigure(figure)}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] group overflow-hidden ${
                selectedFigure?.id === figure.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
              }`}
            >
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${
                    selectedFigure?.id === figure.id
                      ? "bg-background text-foreground"
                      : "bg-foreground text-background"
                  }`}>
                    {figure.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">
                        {figure.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs ${
                        selectedFigure?.id === figure.id ? "text-background/70" : "text-muted-foreground"
                      }`}>
                        {figure.era}
                      </p>
                      {getFigureDebateCount(figure.id) > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/20 text-foreground/90">
                          {getFigureDebateCount(figure.id)} debate{getFigureDebateCount(figure.id) !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
                      selectedFigure?.id === figure.id ? "text-background/80" : "text-muted-foreground"
                    }`}>
                      {figure.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {figure.traits.slice(0, 3).map((trait) => (
                        <span
                          key={trait}
                          className={`px-2 py-0.5 text-[10px] rounded-full ${
                            selectedFigure?.id === figure.id
                              ? "bg-background/20 text-background"
                              : "bg-foreground/10 text-foreground/80"
                          }`}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                    selectedFigure?.id === figure.id
                      ? "border-background bg-background"
                      : "border-foreground/30"
                  }`}>
                    {selectedFigure?.id === figure.id && (
                      <span className="text-foreground text-xs">✓</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {figures.length > visibleCount && (
          <div className="flex justify-center mb-10 sm:mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((c) => c + 8)}
              className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press px-6 sm:px-8 py-4 sm:py-5 h-auto"
            >
              <Swords size={24} strokeWidth={1.5} className="shrink-0 sm:w-7 sm:h-7" />
            </Button>
          </div>
        )}

        {selectedFigure && (
          <div ref={topicSectionRef} className="max-w-3xl mx-auto animate-fade-up">
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                SELECT A TOPIC
              </h3>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-3 mb-10">
              {selectedFigure.topics.map((topic) => (
                <Card
                  key={topic.id}
                  onClick={() => selectTopic(topic)}
                  className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    selectedTopic?.id === topic.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        selectedTopic?.id === topic.id
                          ? "bg-background text-foreground"
                          : "bg-foreground/10 text-foreground"
                      }`}>
                        {selectedFigure.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm mb-1 ${selectedTopic?.id === topic.id ? "" : ""}`}>
                          {topic.title}
                        </h4>
                        {topic.description && (
                          <p className={`text-xs line-clamp-2 ${selectedTopic?.id === topic.id ? "text-background/70" : "text-muted-foreground"}`}>
                            {topic.description}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedTopic?.id === topic.id
                          ? "border-background bg-background"
                          : "border-foreground/30"
                      }`}>
                        {selectedTopic?.id === topic.id && (
                          <span className="text-foreground text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedFigure && selectedTopic && (
          <div ref={settingsSectionRef} className="max-w-2xl mx-auto animate-fade-up delay-200">
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight mb-6">
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
