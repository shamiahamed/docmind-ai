import { useCallback, useReducer, useRef } from "react";
import { streamChat } from "@/lib/services";
import type {
  AgentRunStep,
  ChunkRef,
  Citation,
  Critique,
  StreamEvent,
  ChatStreamRequest,
} from "@/lib/services/types";

// ─── State shape ────────────────────────────────────────────────────────────

export type StreamState = {
  streaming: boolean;
  steps: AgentRunStep[];
  chunks: ChunkRef[];
  draft: string;
  citations: Citation[];
  critique: Critique | undefined;
  error: string | undefined;
  usage: { tokens: number; ms: number } | undefined;
};

const INIT: StreamState = {
  streaming: false,
  steps: [],
  chunks: [],
  draft: "",
  citations: [],
  critique: undefined,
  error: undefined,
  usage: undefined,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "START" }
  | { type: "RESET" }
  | { type: "DONE_STREAMING" }
  | { type: "EVENT"; ev: StreamEvent };

function reducer(state: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "START":
      return { ...INIT, streaming: true };
    case "RESET":
      return INIT;
    case "DONE_STREAMING":
      return { ...state, streaming: false };
    case "EVENT": {
      const ev = action.ev;
      switch (ev.type) {
        case "agent_start": {
          const step: AgentRunStep = { agent: ev.agent, task: ev.task, status: "running" };
          return { ...state, steps: [...state.steps, step] };
        }
        case "agent_end": {
          // Mark the last matching running step as done
          let found = false;
          const steps = [...state.steps].reverse().map((s) => {
            if (!found && s.agent === ev.agent && s.status === "running") {
              found = true;
              return { ...s, status: "done" as const, ms: ev.ms, summary: ev.summary };
            }
            return s;
          }).reverse();
          return { ...state, steps };
        }
        case "retrieval":
          return { ...state, chunks: [...state.chunks, ...ev.chunks] };
        case "token":
          return { ...state, draft: state.draft + ev.delta };
        case "citation": {
          const chunk = state.chunks.find((c) => c.chunk_id === ev.chunk_id);
          const cit: Citation = {
            n: ev.n,
            doc_id: ev.doc_id,
            doc_name: ev.doc_name,
            page: ev.page,
            chunk_id: ev.chunk_id,
            score: chunk?.score,
            snippet: chunk?.snippet,
          };
          // Dedupe by n
          if (state.citations.some((c) => c.n === ev.n)) return state;
          return { ...state, citations: [...state.citations, cit] };
        }
        case "critic":
          return { ...state, critique: { verdict: ev.verdict, issues: ev.issues } };
        case "done":
          return { ...state, streaming: false, usage: ev.usage };
        case "error":
          return { ...state, streaming: false, error: ev.message };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentStream() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Start a streaming chat request. Resolves when the stream ends.
   * Returns final state snapshot for caller to persist to Supabase.
   */
  const run = useCallback(
    async (req: ChatStreamRequest, token?: string): Promise<StreamState> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      dispatch({ type: "START" });

      // We build a local shadow to return at the end without depending on
      // the async state flush from React's batched updates.
      let shadow = { ...INIT, streaming: true };

      const apply = (ev: StreamEvent) => {
        const next = reducer(shadow as StreamState, { type: "EVENT", ev });
        shadow = next;
        dispatch({ type: "EVENT", ev });
      };

      try {
        for await (const ev of streamChat(req, token)) {
          if (abortRef.current.signal.aborted) break;
          apply(ev);
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          // Ignore manual aborts
        } else {
          apply({ type: "error", code: "stream_error", message: String(e) });
        }
      }

      // Ensure streaming flag is off even if no "done" event arrived
      if (shadow.streaming) {
        shadow = { ...shadow, streaming: false };
        dispatch({ type: "DONE_STREAMING" });
      }

      return shadow as StreamState;
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "DONE_STREAMING" });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  return { state, run, stop, reset };
}
