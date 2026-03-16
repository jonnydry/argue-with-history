"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DebateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Debate error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 noise-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight font-display">
            Debate Interrupted
          </h1>
          <p className="text-muted-foreground text-sm">
            An error occurred during the debate. Your progress may have been saved automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button asChild variant="default" className="gap-2">
            <Link href="/figures">
              <Users className="w-4 h-4" />
              Choose Opponent
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
