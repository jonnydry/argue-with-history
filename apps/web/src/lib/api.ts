import { FigureInfo, DebateTopic, StartDebateRequest, DebateState, SubmitArgumentRequest, SubmitArgumentResponse, StartDebateResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const REQUEST_TIMEOUT_MS = 30000;

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      const msg = Array.isArray(error.detail)
        ? error.detail
            .map((e: { msg?: string }) => e.msg)
            .filter(Boolean)
            .join("; ") || "Validation error"
        : (typeof error.detail === "string" ? error.detail : null) || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  figures: {
    list: () => fetchAPI<FigureInfo[]>("/figures"),
    get: (id: string) => fetchAPI<FigureInfo>(`/figures/${id}`),
    getSources: (id: string) =>
      fetchAPI<{ sources: Array<{ id: string; title: string; type: string; work?: string }> }>(
        `/figures/${id}/sources`
      ),
    getTopics: (id: string) => fetchAPI<DebateTopic[]>(`/figures/${id}/topics`),
    getTopicPreview: (figureId: string, topicId: string) =>
      fetchAPI<{ passages: Array<{ source_id: string; title: string; text_excerpt: string }>; sources: string[] }>(
        `/figures/${figureId}/topics/${topicId}/preview`
      ),
    getTopicPrimer: (figureId: string, topicId: string) =>
      fetchAPI<{ position_summary?: string; sample_quote?: string | null; user_task?: string }>(
        `/figures/${figureId}/topics/${topicId}/primer`
      ),
  },

  debate: {
    start: (data: StartDebateRequest) =>
      fetchAPI<StartDebateResponse>("/debate/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    submitTurn: (data: SubmitArgumentRequest) =>
      fetchAPI<SubmitArgumentResponse>("/debate/turn", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    get: (id: string) => fetchAPI<DebateState>(`/debate/${id}`),
    
    end: (id: string) =>
      fetchAPI<{ debate: DebateState; learning_summary?: { summary?: string; suggested_readings?: Array<{ title: string; reason: string }> } }>(`/debate/${id}/end`, { method: "POST" }),
    
    delete: (id: string) =>
      fetchAPI<{ success: boolean }>(`/debate/${id}`, { method: "DELETE" }),
  },
};
