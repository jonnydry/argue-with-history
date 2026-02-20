"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { useDebateStore } from "@/stores/debate-store";
import type { FigureInfo } from "@/lib/types";

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
    <Card className="bg-secondary/40 backdrop-blur-sm border border-border/50 overflow-hidden animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-foreground/20 shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-24 bg-foreground/20 rounded"></div>
              <div className="h-3 w-16 bg-foreground/10 rounded"></div>
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

function FigureCard({ figure, index }: { figure: FigureInfo; index: number }) {
  return (
    <Card 
      className="bg-secondary/40 backdrop-blur-sm border border-border/50 hover:border-foreground/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-sm shrink-0">
            {figure.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm tracking-tight truncate">
                {figure.name}
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                {figure.era.split('(')[0].trim()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {figure.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {figure.traits.slice(0, 2).map((trait) => (
                <span 
                  key={trait} 
                  className="px-2 py-0.5 bg-foreground/10 text-[10px] rounded-full text-foreground/80"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const steps = [
  {
    num: "01",
    title: "Choose Your Opponent",
    description: "Select from historical philosophers and pick a debate topic.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 block"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M9.5 6.5L21 18v3h-3L6.5 9.5"/><path d="M11 5l-6 6"/><path d="M8 8L4 4"/><path d="M5 3L3 5"/></svg>
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
    fetchFigures();
  }, [fetchFigures]);

  const scrollFigures = figures.length > 0 ? [...figures, ...figures] : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-display noise-bg">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M9.5 6.5L21 18v3h-3L6.5 9.5"/><path d="M11 5l-6 6"/><path d="M8 8L4 4"/><path d="M5 3L3 5"/></svg>
            <h1 className="text-2xl font-bold tracking-tight">
              ARGUE WITH HISTORY
            </h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/figures" className="text-sm font-medium hover:underline underline-offset-4">
              FIGURES
            </Link>
            <Link href="/figures">
              <Button variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background btn-press">
                START
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                DON&apos;T READ
                <br />
                <span className="text-stroke">HISTORY.</span>
                <br />
                <span className="underline-thick decoration-foreground">DEFEAT IT.</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mb-12 leading-relaxed">
                Not a spectator sport—you argue. The figure hits back. You must respond.
                Learn their perspective by engaging with it, not watching.
              </p>
              <Link href="/figures">
                <Button size="lg" className="text-lg px-10 py-6 h-auto bg-foreground text-background hover:bg-foreground/90 btn-press">
                  CHOOSE YOUR OPPONENT →
                </Button>
              </Link>
            </div>

            <div className="relative h-[500px] overflow-hidden lg:h-[600px]">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"></div>
              
              {isLoading && figures.length === 0 ? (
                <div className="space-y-3 px-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <FigureSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 animate-scroll-vertical px-4">
                  {scrollFigures.map((figure, index) => (
                    <FigureCard key={`${figure.id}-${index}`} figure={figure} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/20">
          <div className="container mx-auto px-6 py-24">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-center">HOW IT WORKS</h3>
              
              <div className="space-y-16">
                {steps.map((step, index) => {
                  const { ref, isInView } = stepRefs[index];
                  return (
                    <div 
                      key={step.num}
                      ref={ref}
                      className={`flex gap-8 items-start transition-all duration-700 ease-out ${
                        isInView 
                          ? "opacity-100 translate-y-0" 
                          : "opacity-0 translate-y-12"
                      }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full grid place-items-center transition-all duration-500 ${
                          isInView 
                            ? "bg-foreground text-background scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                            : "bg-secondary text-foreground scale-75"
                        }`}>
                          {step.icon}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-px h-24 bg-border transition-all duration-700 ${
                            isInView ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                          }`} style={{ transitionDelay: `${index * 150 + 300}ms` }} />
                        )}
                      </div>
                      <div className="flex-1 pt-3">
                        <span className="text-sm font-medium text-muted-foreground mb-2 block">STEP {step.num}</span>
                        <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
                        <p className="text-muted-foreground text-lg leading-relaxed">
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

        <section className="border-t border-border bg-foreground text-background py-16">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold tracking-tight mb-6">READY TO DEBATE?</h3>
            <Link href="/figures">
              <Button size="lg" className="text-lg px-12 py-6 h-auto bg-background text-foreground hover:bg-background/90 btn-press">
                BEGIN →
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>Built with Next.js • FastAPI • Grok</p>
        </div>
      </footer>
    </div>
  );
}
