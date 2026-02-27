"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type LoadedSource = { id: string; title: string; type: string; work?: string };

interface FigureLoadedTextsProps {
  figureId: string;
  variant?: "default" | "selected" | "highlighted";
  className?: string;
}

export function FigureLoadedTexts({
  figureId,
  variant = "default",
  className = "",
}: FigureLoadedTextsProps) {
  const [expanded, setExpanded] = useState(false);
  const [sources, setSources] = useState<LoadedSource[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded && sources === null && !loading) {
      setLoading(true);
      api.figures
        .getSources(figureId)
        .then((res) => setSources(res.sources))
        .catch(() => setSources([]))
        .finally(() => setLoading(false));
    }
  }, [expanded, figureId, sources, loading]);

  const textColor =
    variant === "selected"
      ? "text-background/80"
      : variant === "highlighted"
        ? "text-foreground/90"
        : "text-muted-foreground";
  const hoverColor =
    variant === "selected"
      ? "hover:text-background"
      : variant === "highlighted"
        ? "hover:text-foreground"
        : "hover:text-foreground/80";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className={`flex items-center gap-1 text-xs font-medium ${textColor} ${hoverColor} transition-colors`}
      >
        {expanded ? (
          <ChevronUp className="size-3 shrink-0" />
        ) : (
          <ChevronDown className="size-3 shrink-0" />
        )}
        {loading
          ? "Loading..."
          : expanded && sources !== null
            ? `${sources.length} loaded texts`
            : "View loaded texts"}
      </button>
      {expanded && sources !== null && (
        <ul className="mt-2 max-h-32 overflow-y-auto space-y-0.5 text-xs pl-4 border-l border-current/20">
          {sources.map((s) => (
            <li key={s.id} className={`${textColor} truncate`} title={s.work ? `${s.work}: ${s.title}` : s.title}>
              {s.work ? (
                <>
                  <span className="text-current/60">{s.work}:</span> {s.title}
                </>
              ) : (
                <>
                  <span className="text-current/60">{s.type}:</span> {s.title}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
