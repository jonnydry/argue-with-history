import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DebateState, FigureInfo, DebateTopic, Figure, Passage } from "@/lib/types";
import { api } from "@/lib/api";
import { recordDebateComplete } from "@/lib/progression";

function createDebouncedStorage(
  base: Storage | null,
  delayMs: number
): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void } {
  if (!base) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pending: { key: string; value: string } | null = null;
  const flush = () => {
    if (pending) {
      base.setItem(pending.key, pending.value);
      pending = null;
    }
    timeout = null;
  };
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => {
      pending = { key: k, value: v };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(flush, delayMs);
    },
    removeItem: (k) => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      pending = null;
      base.removeItem(k);
    },
  };
}

interface DebateStore {
  figures: FigureInfo[];
  selectedFigure: FigureInfo | null;
  selectedTopic: DebateTopic | null;
  currentDebate: DebateState | null;
  openingStatement: string | null;
  openingKeyClaims: string[];
  debateSources: string[];
  openingPassages: Passage[];
  learningSummary: { summary?: string; suggested_readings?: Array<{ title: string; reason: string }> } | null;
  topicPrimer: { position_summary?: string; sample_quote?: string | null; user_task?: string } | null;
  topicPrimerKey: string | null;
  debateMode: "structured" | "freeform";
  maxTurns: number;
  structuredInput: boolean;
  scholarMode: boolean;
  isLoading: boolean;
  error: string | null;
  figuresLastFetched: number | null;

  fetchFigures: () => Promise<void>;
  prefetchTopicPrimer: () => Promise<void>;
  hydrateSelectionsFromDebate: () => void;
  selectFigure: (figure: FigureInfo) => void;
  selectTopic: (topic: DebateTopic) => void;
  setDebateMode: (mode: "structured" | "freeform") => void;
  setMaxTurns: (turns: number) => void;
  setStructuredInput: (enabled: boolean) => void;
  setScholarMode: (enabled: boolean) => void;
  startDebate: () => Promise<boolean>;
  submitArgument: (argument: string) => Promise<void>;
  endDebate: () => Promise<void>;
  reset: () => void;
  clearStaleDebateIfMismatch: () => void;
  clearError: () => void;
}

let fetchPromise: Promise<void> | null = null;
let primerPromise: Promise<void> | null = null;
let primerPromiseKey: string | null = null;

export const useDebateStore = create<DebateStore>()(
  persist(
    (set, get) => ({
      figures: [],
      selectedFigure: null,
      selectedTopic: null,
      currentDebate: null,
      openingStatement: null,
      openingKeyClaims: [],
      debateSources: [],
      openingPassages: [],
      learningSummary: null,
      topicPrimer: null,
      topicPrimerKey: null,
      debateMode: "structured",
      maxTurns: 3,
      structuredInput: false,
      scholarMode: false,
      isLoading: false,
      error: null,
      figuresLastFetched: null,

      fetchFigures: async () => {
        const { figures, figuresLastFetched } = get();
        
        if (figures.length > 0) {
          const oneHour = 60 * 60 * 1000;
          if (figuresLastFetched && Date.now() - figuresLastFetched < oneHour) {
            return;
          }
        }

        if (fetchPromise) {
          return fetchPromise;
        }

        set({ isLoading: true, error: null });
        
        fetchPromise = api.figures.list()
          .then((figures) => {
            set({ figures, isLoading: false, figuresLastFetched: Date.now() });
            get().hydrateSelectionsFromDebate();
          })
          .catch((error) => {
            set({ error: error.message, isLoading: false });
          })
          .finally(() => {
            fetchPromise = null;
          });

        return fetchPromise;
      },

      selectFigure: (figure) => {
        const { currentDebate } = get();
        const figureChanged = currentDebate && currentDebate.figure !== figure.id;
        set({
          selectedFigure: figure,
          selectedTopic: null,
          topicPrimer: null,
          topicPrimerKey: null,
          ...(figureChanged ? {
            currentDebate: null,
            openingStatement: null,
            openingKeyClaims: [],
            debateSources: [],
            openingPassages: [],
            learningSummary: null,
          } : {}),
        });
      },

      selectTopic: (topic) => {
        const { currentDebate } = get();
        const topicChanged = currentDebate && 
          (currentDebate as { topic_id?: string }).topic_id !== topic.id &&
          currentDebate.topic !== topic.title;
        set({
          selectedTopic: topic,
          ...(topicChanged ? {
            currentDebate: null,
            openingStatement: null,
            openingKeyClaims: [],
            debateSources: [],
            openingPassages: [],
            learningSummary: null,
          } : {}),
        });
      },

      hydrateSelectionsFromDebate: () => {
        const { currentDebate, figures, selectedFigure, selectedTopic } = get();
        if (!currentDebate || figures.length === 0) return;
        if (selectedFigure && selectedTopic) return;

        const figure = figures.find((f) => f.id === currentDebate.figure);
        if (!figure) return;

        const topic = figure.topics.find(
          (t) =>
            t.id === (currentDebate as { topic_id?: string }).topic_id ||
            t.title === currentDebate.topic
        );
        if (!topic) return;

        set({ selectedFigure: figure, selectedTopic: topic });
      },

      prefetchTopicPrimer: async () => {
        const { selectedFigure, selectedTopic } = get();
        if (!selectedFigure || !selectedTopic) return;
        const key = `${selectedFigure.id}:${selectedTopic.id}`;
        if (get().topicPrimerKey === key) return;
        if (primerPromise && primerPromiseKey === key) {
          await primerPromise;
          return;
        }

        primerPromiseKey = key;
        primerPromise = (async () => {
          try {
            const primer = await api.figures.getTopicPrimer(
              selectedFigure.id,
              selectedTopic.id
            );
            set({ topicPrimer: primer, topicPrimerKey: key });
          } catch {
            set({ topicPrimer: null, topicPrimerKey: null });
          } finally {
            if (primerPromiseKey === key) {
              primerPromise = null;
              primerPromiseKey = null;
            }
          }
        })();
        await primerPromise;
      },

      setDebateMode: (mode) => {
        set({ debateMode: mode });
      },

      setMaxTurns: (turns) => {
        set({ maxTurns: turns });
      },

      setStructuredInput: (enabled) => {
        set({ structuredInput: enabled });
      },

      setScholarMode: (enabled) => {
        set({ scholarMode: enabled });
      },

      startDebate: async () => {
        const { selectedFigure, selectedTopic, debateMode, maxTurns } = get();
        if (!selectedFigure || !selectedTopic) {
          set({ error: "Please select a figure and topic" });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await api.debate.start({
            figure: selectedFigure.id as Figure,
            topic_id: selectedTopic.id,
            mode: debateMode,
            max_turns: maxTurns,
          });
          set({ 
            currentDebate: response.debate, 
            openingStatement: response.opening_statement,
            openingKeyClaims: response.opening_key_claims ?? [],
            debateSources: response.sources,
            openingPassages: response.passages ?? [],
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          return false;
        }
      },

      submitArgument: async (argument) => {
        const { currentDebate } = get();
        if (!currentDebate) {
          set({ error: "No active debate" });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await api.debate.submitTurn({
            debate_id: currentDebate.id,
            argument,
          });
          const debate = response.debate;
        if (debate?.status === "completed" && debate.figure && debate.topic_id) {
          recordDebateComplete(debate.figure, debate.topic_id);
        }
        set({
            currentDebate: debate,
            learningSummary: response.learning_summary ?? null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      endDebate: async () => {
        const { currentDebate } = get();
        if (!currentDebate) return;

        try {
          const res = await api.debate.end(currentDebate.id);
          const debate = res.debate ?? res;
          if (debate?.status === "completed" && debate.figure && debate.topic_id) {
            recordDebateComplete(debate.figure, debate.topic_id);
          }
          const learningSummary = "learning_summary" in res ? res.learning_summary : null;
          set({ currentDebate: debate, learningSummary });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      reset: () => {
        set({
          selectedFigure: null,
          selectedTopic: null,
          currentDebate: null,
          openingStatement: null,
          openingKeyClaims: [],
          debateSources: [],
          openingPassages: [],
          learningSummary: null,
          topicPrimer: null,
          topicPrimerKey: null,
          error: null,
        });
      },

      clearStaleDebateIfMismatch: () => {
        const { currentDebate, selectedFigure, selectedTopic } = get();
        if (!currentDebate || !selectedFigure || !selectedTopic) return;
        const figureMatches = currentDebate.figure === selectedFigure.id;
        const topicMatches =
          (currentDebate as { topic_id?: string }).topic_id === selectedTopic.id ||
          currentDebate.topic === selectedTopic.title;
        if (!figureMatches || !topicMatches) {
          set({
            currentDebate: null,
            openingStatement: null,
            openingKeyClaims: [],
            debateSources: [],
            openingPassages: [],
            learningSummary: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "argue-with-history",
      storage: createJSONStorage(() =>
        createDebouncedStorage(
          typeof window !== "undefined" ? window.localStorage : null,
          400
        )
      ),
      partialize: (state) => ({
        figures: state.figures,
        figuresLastFetched: state.figuresLastFetched,
        selectedFigure: state.selectedFigure,
        selectedTopic: state.selectedTopic,
        currentDebate: state.currentDebate,
        debateMode: state.debateMode,
        maxTurns: state.maxTurns,
        structuredInput: state.structuredInput,
        scholarMode: state.scholarMode,
      }),
    }
  )
);
