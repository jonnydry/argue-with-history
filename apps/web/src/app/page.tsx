"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebateStore } from "@/stores/debate-store";
import type { FigureInfo } from "@/lib/types";
import { FigureLoadedTexts } from "@/components/figure-loaded-texts";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

function FigureSkeleton() {
  return (
    <Card className="rounded-none border-x-0 border-t-0 border-b border-border/60 bg-transparent overflow-hidden animate-pulse shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground/15 shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-3 w-20 bg-foreground/10 rounded mb-3"></div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-28 bg-foreground/20 rounded"></div>
              <div className="h-3 w-12 bg-foreground/10 rounded"></div>
            </div>
            <div className="h-3 w-full bg-foreground/10 rounded mb-1"></div>
            <div className="h-3 w-3/4 bg-foreground/10 rounded mb-2"></div>
            <div className="flex gap-1">
              <div className="h-4 w-12 bg-foreground/10 rounded-full"></div>
              <div className="h-4 w-16 bg-foreground/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FigureCard({ figure }: { figure: FigureInfo }) {
  return (
    <Card className="rounded-none border-x-0 border-t-0 border-b border-border/60 bg-transparent shadow-none transition-colors duration-300 hover:bg-white/[0.03] overflow-hidden group">
      <CardContent className="p-5 sm:p-6">
        <Link href="/figures" className="block">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-xl font-blackletter shrink-0 transition-transform duration-300 group-hover:scale-105">
              {figure.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Opponent in rotation
                </p>
                <span className="text-[11px] text-accent/75 uppercase tracking-[0.24em] shrink-0">
                  {figure.era.split("(")[0].trim()}
                </span>
              </div>
              <h3 className="editorial-section-title text-2xl tracking-normal truncate mb-2">
                {figure.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                {figure.description}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {figure.traits.slice(0, 2).map((trait) => (
                    <span
                      key={trait}
                      className="px-2.5 py-1 border border-border/60 text-[11px] uppercase tracking-[0.16em] text-foreground/75"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                  Enter -&gt;
                </span>
              </div>
            </div>
          </div>
        </Link>
        <FigureLoadedTexts figureId={figure.id} className="mt-4 pt-4 border-t border-border/40" variant="highlighted" />
      </CardContent>
    </Card>
  );
}

const heroSignals = [
  "source-grounded prompts",
  "judged rebuttals",
  "historical scoring",
];

const steps = [
  {
    num: "01",
    title: "Choose Your Opponent",
    description: "Select from historical philosophers and pick a debate topic.",
    icon: (
      <Swords size={48} strokeWidth={1.5} className="shrink-0 block" />
    ),
  },
  {
    num: "02", 
    title: "Tackle Their Arguments",
    description: "Present your argument. The figure responds. You must address their claims directly—no spectating.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 block">
        <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" x2="16" y1="13" y2="13" />
        <line x1="8" x2="16" y1="17" y2="17" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Get Scored",
    description: "Feedback on logic, historical accuracy, rhetoric, and how well you engaged their rebuttals. Learn and improve.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 block">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    ),
  },
];

export default function Home() {
  const figures = useDebateStore((s) => s.figures);
  const fetchFigures = useDebateStore((s) => s.fetchFigures);
  const isLoading = useDebateStore((s) => s.isLoading);
  const step1 = useInView(0.3);
  const step2 = useInView(0.3);
  const step3 = useInView(0.3);
  const stepRefs = [step1, step2, step3];

  useEffect(() => {
    void fetchFigures();
  }, [fetchFigures]);

  const scrollFigures =
    figures.length > 0 ? [...figures.slice(0, 6), ...figures.slice(0, 6)] : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Swords size={24} strokeWidth={1.5} className="shrink-0 sm:w-7 sm:h-7" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              ARGUE WITH HISTORY
            </h1>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link href="/figures" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4 hidden sm:inline">
              FIGURES
            </Link>
            <Link href="/figures">
              <Button variant="outline" size="sm" className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press sm:text-sm sm:px-4 sm:py-2">
                START
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_38%)] pointer-events-none" />
          <div className="container relative mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] gap-6 lg:gap-10 items-start">
            <div className="max-w-2xl pt-1 sm:pt-2">
              <h2 className="editorial-display text-4xl sm:text-6xl md:text-8xl mb-5 sm:mb-6">
                DON&apos;T READ
                <br />
                <span className="headline-emphasis">HISTORY.</span>
                <br />
                <span className="underline-thick decoration-foreground">DEFEAT IT.</span>
              </h2>
              <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-xl mb-6 sm:mb-8 leading-relaxed">
                Not a spectator sport. Combat the world&apos;s most infamous philosophers and thinkers in your own words. Your arguments will be judged. Increase your understanding, challenge your assumptions, enter the arena.
                <Swords size={20} className="inline-block ml-2 text-foreground/50 align-middle" />
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 sm:mb-8 text-[11px] uppercase tracking-[0.24em] text-accent/80">
                {heroSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/figures">
                  <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press w-full sm:w-auto">
                    CHOOSE YOUR OPPONENT
                  </Button>
                </Link>
                <Link href="/figures">
                  <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 h-auto btn-press w-full sm:w-auto">
                    BROWSE FIGURES
                  </Button>
                </Link>
              </div>
            </div>

              <div className="space-y-3 sm:space-y-4">
                <Card className="arena-panel border-foreground/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="border-b border-border/60 px-6 py-4 sm:px-7 sm:py-5 flex items-center justify-between gap-4 bg-white/[0.03]">
                      <div>
                        <p className="war-label mb-2">What makes it different</p>
                        <p className="editorial-section-title text-2xl sm:text-3xl">Arena Briefing</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-accent/80">
                        <span className="h-px w-8 bg-accent/50" />
                        Live analysis
                      </div>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="border-b lg:border-b-0 lg:border-r border-border/60 px-6 py-6 sm:px-7 sm:py-7 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(255,255,255,0.02))]">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80 mb-3">
                          Not just chat
                        </p>
                        <p className="editorial-section-title text-3xl sm:text-4xl mb-4">
                          Debate the record.
                        </p>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
                          Each exchange is shaped by the figure&apos;s actual texts, then judged for reasoning, rebuttal, and command of the material.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-3">
                        <div className="px-6 py-6 sm:px-5 sm:py-7 border-b sm:border-b-0 sm:border-r border-border/60">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Roster</p>
                          <p className="editorial-section-title text-4xl sm:text-5xl mb-2">30+</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">Historical opponents spanning schools, eras, and temperaments.</p>
                        </div>
                        <div className="px-6 py-6 sm:px-5 sm:py-7 border-b sm:border-b-0 sm:border-r border-border/60 bg-white/[0.02]">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Method</p>
                          <p className="editorial-section-title text-2xl sm:text-3xl mb-2">Source-grounded</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">Responses and primers pull from the figure&apos;s own arguments, not generic roleplay.</p>
                        </div>
                        <div className="px-6 py-6 sm:px-5 sm:py-7">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">Verdict</p>
                          <p className="editorial-section-title text-2xl sm:text-3xl mb-2">Round scoring</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">Logic, historical accuracy, rhetoric, and rebuttal are scored after each clash.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="relative hidden sm:block border border-border/60 bg-white/[0.02] overflow-hidden">
                  <div className="border-b border-border/60 px-5 py-4 flex items-center justify-between gap-4 bg-white/[0.02]">
                    <div>
                      <p className="war-label mb-2">Rotating roster</p>
                      <p className="editorial-section-title text-2xl">Enter the archive</p>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground text-right max-w-28">
                      Live opponent queue
                    </p>
                  </div>
                  <div className="relative h-[380px] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"></div>

                    {isLoading && figures.length === 0 ? (
                      <div>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FigureSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="animate-scroll-vertical">
                        {scrollFigures.map((figure, index) => (
                          <FigureCard key={`${figure.id}-${index}`} figure={figure} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <p className="war-label mb-3">How it works</p>
                <h3 className="editorial-section-title text-3xl sm:text-4xl md:text-5xl">Three rounds to the arena</h3>
              </div>

              <div className="space-y-8 sm:space-y-14">
                {steps.map((step, index) => {
                  const { ref, isInView } = stepRefs[index];
                  return (
                    <div 
                      key={step.num}
                      ref={ref}
                      className={`flex gap-4 sm:gap-8 items-start transition-all duration-700 ease-out ${
                        isInView 
                          ? "opacity-100 translate-y-0" 
                          : "opacity-0 translate-y-12"
                      }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 sm:w-24 sm:h-24 rounded-full grid place-items-center transition-all duration-500 ${
                          isInView 
                            ? "bg-foreground text-background scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                            : "bg-secondary text-foreground scale-75"
                        }`}>
                          <span className="[&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-10 sm:[&>svg]:h-10">
                            {step.icon}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-px h-12 sm:h-24 bg-border transition-all duration-700 ${
                            isInView ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                          }`} style={{ transitionDelay: `${index * 150 + 300}ms` }} />
                        )}
                      </div>
                      <div className="flex-1 pt-1 sm:pt-3">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 block">STEP {step.num}</span>
                        <h4 className="editorial-section-title text-xl sm:text-2xl mb-2 sm:mb-3 normal-case">{step.title}</h4>
                        <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed max-w-2xl">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-foreground text-background py-8 sm:py-14">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h3 className="editorial-section-title text-2xl sm:text-3xl mb-4 sm:mb-5">Ready to debate?</h3>
            <Link href="/figures">
              <Button size="lg" className="text-base sm:text-lg px-10 sm:px-12 py-5 sm:py-6 h-auto bg-background text-foreground hover:bg-background/90 btn-press w-full sm:w-auto">
                BEGIN -&gt;
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-muted-foreground text-xs sm:text-sm">
          <p>Built with Next.js • FastAPI • Grok • Replit</p>
        </div>
      </footer>
    </div>
  );
}
