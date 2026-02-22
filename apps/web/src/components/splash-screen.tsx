"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fading, setFading] = useState(false);

  const handleFinish = useCallback(() => {
    if (fading) return;
    setFading(true);
    timeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem("splash_seen", "true");
      } catch {}
      onComplete();
    }, 600);
  }, [fading, onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      handleFinish();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-600 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src="/splash.mp4"
        className="w-full h-full object-cover"
        muted
        playsInline
        onEnded={handleFinish}
      />
      <button
        onClick={handleFinish}
        className="absolute bottom-8 right-8 text-white/60 hover:text-white text-sm font-medium tracking-wider uppercase transition-colors px-4 py-2 border border-white/20 hover:border-white/50 rounded"
      >
        SKIP
      </button>
    </div>
  );
}
