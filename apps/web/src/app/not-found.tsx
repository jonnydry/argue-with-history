import Link from "next/link";
import { Swords, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 noise-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Swords className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-mono uppercase tracking-widest text-accent">
            404
          </p>
          <h1 className="text-3xl font-bold tracking-tight font-display">
            Page Not Found
          </h1>
          <p className="text-muted-foreground text-sm">
            This territory has not been charted. Perhaps you were looking for the arena?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Home
            </Link>
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
