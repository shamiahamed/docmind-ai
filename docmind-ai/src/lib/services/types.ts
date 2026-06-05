// Service-layer types — shared between mock and live implementations.
// These mirror the FastAPI/LangGraph backend contract documented in docs/backend-spec.md.

export type AgentName =
  | "supervisor"
  | "retriever"
  | "comparison"
  | "summarizer"
  | "math_table"
  | "synthesizer"
  | "critic";

export type ChunkRef = {
  doc_id: string;
  doc_name: string;
  page: number;
  chunk_id: string;
  score?: number;
  snippet?: string;
};

export type Citation = { n: number } & ChunkRef;

export type Critique = {
  verdict: "pass" | "revise" | "fail";
  issues?: string[];
};

export type AgentRunStep = {
  agent: AgentName;
  task: string;
  status: "running" | "done" | "fail";
  ms?: number;
  summary?: string;
};

export type StreamEvent =
  | { type: "agent_start"; agent: AgentName; task: string }
  | { type: "agent_end"; agent: AgentName; summary: string; ms: number }
  | { type: "retrieval"; chunks: ChunkRef[] }
  | { type: "token"; delta: string }
  | { type: "citation"; n: number; doc_id: string; doc_name: string; page: number; chunk_id: string }
  | { type: "critic"; verdict: Critique["verdict"]; issues?: string[] }
  | { type: "done"; message_id: string; usage: { tokens: number; ms: number } }
  | { type: "error"; code: string; message: string };

export type ChatStreamRequest = {
  conversation_id: string;
  question: string;
};
