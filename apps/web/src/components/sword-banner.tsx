"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SwordBanner() {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimating(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <section className={`sword-banner-section relative overflow-hidden border-b border-border ${!animating ? "sword-banner-pre-animate" : ""}`}>
      <div className="absolute inset-0 sword-banner-bg pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
          <div
            className={`sword-banner-line sword-banner-line-left ${animating ? "sword-banner-line-animate" : ""}`}
          />

          <div className={`sword-banner-icon-wrapper ${animating ? "sword-banner-icon-animate" : ""}`}>
            <div className={`sword-banner-glow ${animating ? "sword-banner-glow-animate" : ""}`} />
            <Image
              src="/swords-icon.png"
              alt="Crossed swords"
              width={80}
              height={80}
              className="sword-banner-icon relative z-10 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24"
              priority
            />
          </div>

          <div
            className={`sword-banner-line sword-banner-line-right ${animating ? "sword-banner-line-animate" : ""}`}
          />
        </div>

        <div className={`sword-banner-text text-center mt-3 sm:mt-4 ${animating ? "sword-banner-text-animate" : ""}`}>
          <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.35em] text-foreground/40 font-medium">
            The Intellectual Arena Awaits
          </p>
        </div>
      </div>
    </section>
  );
}
