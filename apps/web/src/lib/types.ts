export type Figure =
  | "machiavelli"
  | "socrates"
  | "epictetus"
  | "mill"
  | "aurelius"
  | "locke"
  | "rousseau"
  | "nietzsche"
  | "hobbes"
  | "plato"
  | "aristotle"
  | "hume"
  | "kant"
  | "wollstonecraft"
  | "marx"
  | "thoreau"
  | "seneca"
  | "cicero"
  | "lucretius"
  | "descartes"
  | "spinoza"
  | "leibniz"
  | "voltaire"
  | "paine"
  | "burke"
  | "douglass"
  | "emerson"
  | "dubois"
  | "darwin"
  | "james"
  | "tocqueville"
  | "russell";
export type DebateMode = "structured" | "freeform" | "socratic";

export interface DebateTopic {
  id: string;
  title: string;
  description?: string;
}

export interface FigureInfo {
  id: string;
  name: string;
  era: string;
  description: string;
  works: string[];
  topics: DebateTopic[];
  traits: string[];
}

export interface Passage {
  source_id: string;
  title: string;
  text_excerpt: string;
}

export interface DebateTurn {
  turn_number: number;
  user_argument: string;
  figure_response: string;
  sources_used: string[];
  key_claims?: string[];
  passages?: Passage[];
  scores_error?: string;
  scores: {
    logic_score: number;
    historical_accuracy_score: number;
    rhetoric_score: number;
    rebuttal_score?: number;
    logic_reason?: string;
    historical_reason?: string;
    rhetoric_reason?: string;
    rebuttal_reason?: string;
    strengths: string[];
    improvements: string[];
    source_used_well: boolean;
  } | null;
}

export interface DebateState {
  id: string;
  figure: Figure;
  topic: string;
  topic_id?: string;
  mode: DebateMode;
  max_turns: number;
  current_turn: number;
  turns: DebateTurn[];
  created_at: number;
  status: "active" | "completed";
  opening_statement?: string | null;
}

export interface StartDebateRequest {
  figure: Figure;
  topic_id: string;
  mode: DebateMode;
  max_turns: number;
}

export interface SubmitArgumentRequest {
  debate_id: string;
  argument: string;
}

export interface SubmitArgumentResponse {
  debate: DebateState;
  turn: DebateTurn;
  context: {
    sources: string[];
  };
  learning_summary?: {
    summary?: string;
    suggested_readings?: Array<{ title: string; reason: string }>;
  };
}

export interface StartDebateResponse {
  debate: DebateState;
  opening_statement: string;
  opening_key_claims?: string[];
  sources: string[];
  passages?: Passage[];
}
