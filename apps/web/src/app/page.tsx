"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Swords } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebateStore } from "@/stores/debate-store";
import { SwordBanner } from "@/components/sword-banner";

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

const briefingPoints = [
  {
    label: "Roster",
    emphasis: "30+",
    body: "Historical opponents across eras, schools, and temperaments.",
  },
  {
    label: "Method",
    emphasis: "Source-grounded",
    body: "Responses and primers are anchored in the figure's actual arguments.",
  },
  {
    label: "Verdict",
    emphasis: "Round scoring",
    body: "Each exchange is judged for logic, historical accuracy, rhetoric, and rebuttal.",
  },
];

function FigurePreviewSkeleton() {
  return (
    <div className="rounded-lg border border-border/50 bg-white/[0.02] px-4 py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-foreground/10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-28 rounded bg-foreground/15 mb-2" />
          <div className="h-3 w-20 rounded bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}

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
  const featuredFigures = figures.slice(0, 3);
  const scrollFigures = figures;

  useEffect(() => {
    void fetchFigures();
  }, [fetchFigures]);

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

      <SwordBanner />

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_38%)] pointer-events-none" />
          <div className="container relative mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] gap-8 lg:gap-12 items-start">
            <div className="max-w-2xl pt-1 sm:pt-2">
              <p className="war-label mb-4">Enter the arena</p>
              <h2 className="editorial-display text-[clamp(3.75rem,9vw,7rem)] mb-6 leading-[0.92]">
                DON&apos;T READ
                <br />
                <span className="headline-emphasis">HISTORY.</span>
                <br />
                <span className="underline-thick decoration-foreground">DEFEAT IT.</span>
              </h2>
              <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-xl mb-8 sm:mb-10 leading-relaxed">
                Not a spectator sport. Combat the world&apos;s most infamous philosophers and thinkers in your own words. Your arguments will be judged. Increase your understanding, challenge your assumptions, enter the arena.
                <Swords size={20} className="inline-block ml-2 text-foreground/50 align-middle" />
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/figures">
                  <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press w-full sm:w-auto">
                    CHOOSE YOUR OPPONENT
                  </Button>
                </Link>
              </div>
            </div>

              <Card className="arena-panel border-foreground/10 overflow-hidden lg:mt-2">
                <CardContent className="p-0">
                  <div className="px-6 py-5 sm:px-7 sm:py-6 border-b border-border/60 bg-white/[0.03]">
                    <p className="war-label mb-2">What makes it different</p>
                    <h3 className="editorial-section-title text-2xl sm:text-3xl mb-3">Arena Briefing</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                      Debate real positions instead of chatting with a costume. The app pushes you to engage the record and then judges how well you did.
                    </p>
                  </div>

                  <div className="p-6 sm:p-7 grid gap-5">
                    {briefingPoints.map((point) => (
                      <div key={point.label} className="border-l-2 border-accent/45 pl-4 sm:pl-5">
                        <div className="flex flex-col gap-1 mb-2">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-accent/80">
                            {point.label}
                          </p>
                          <p className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                            {point.emphasis}
                          </p>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {point.body}
                        </p>
                      </div>
                    ))}

                    <div className="border-t border-border/60 pt-5 sm:pt-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-accent/80 mb-1">
                            In the arena
                          </p>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            A few of the voices waiting inside.
                          </p>
                        </div>
                        <Link href="/figures" className="text-[11px] uppercase tracking-[0.22em] text-foreground/75 hover:text-foreground">
                          View all
                        </Link>
                      </div>

                      <div
                        className="relative overflow-hidden h-[224px]"
                        style={{
                          maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                        }}
                      >
                        {isLoading && scrollFigures.length === 0 ? (
                          <div className="flex flex-col gap-3">
                            {Array.from({ length: 3 }).map((_, index) => <FigurePreviewSkeleton key={index} />)}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 animate-scroll-vertical" style={{ animationDuration: "60s" }}>
                            {scrollFigures.map((figure) => (
                              <Link
                                key={`a-${figure.id}`}
                                href="/figures"
                                className="rounded-lg border border-border/50 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04] shrink-0"
                              >
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-blackletter shrink-0">
                                    {figure.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                      <p className="text-lg font-semibold tracking-tight truncate text-foreground">
                                        {figure.name}
                                      </p>
                                      <span className="hidden sm:block text-[11px] uppercase tracking-[0.22em] text-accent/75 shrink-0">
                                        {figure.era.split("(")[0].trim()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {figure.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                            {scrollFigures.map((figure) => (
                              <Link
                                key={`b-${figure.id}`}
                                href="/figures"
                                className="rounded-lg border border-border/50 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04] shrink-0"
                              >
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-blackletter shrink-0">
                                    {figure.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3 mb-1">
                                      <p className="text-lg font-semibold tracking-tight truncate text-foreground">
                                        {figure.name}
                                      </p>
                                      <span className="hidden sm:block text-[11px] uppercase tracking-[0.22em] text-accent/75 shrink-0">
                                        {figure.era.split("(")[0].trim()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {figure.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h3 className="editorial-section-title text-3xl sm:text-4xl md:text-5xl">How it works</h3>
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
