import type { ChatStreamRequest, ChunkRef, StreamEvent } from "./types";

const sampleChunks: ChunkRef[] = [
  { doc_id: "doc_a", doc_name: "Quarterly Report.pdf", page: 4, chunk_id: "c-12", score: 0.92, snippet: "Revenue increased 18% year over year, driven primarily by enterprise expansion…" },
  { doc_id: "doc_a", doc_name: "Quarterly Report.pdf", page: 7, chunk_id: "c-19", score: 0.88, snippet: "Operating margin improved to 22.4% versus 19.1% in the prior period…" },
  { doc_id: "doc_b", doc_name: "Strategy Memo.docx", page: 2, chunk_id: "c-3", score: 0.81, snippet: "We will prioritise mid-market accounts in EMEA throughout FY26…" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function* mockChatStream(req: ChatStreamRequest): AsyncGenerator<StreamEvent> {
  const t0 = Date.now();
  // Supervisor
  yield { type: "agent_start", agent: "supervisor", task: "Plan agents for: " + req.question };
  await sleep(350);
  yield { type: "agent_end", agent: "supervisor", summary: "Routed to retriever + synthesizer + critic", ms: 350 };

  // Retriever
  yield { type: "agent_start", agent: "retriever", task: "Hybrid search across your documents" };
  await sleep(550);
  yield { type: "retrieval", chunks: sampleChunks };
  yield { type: "agent_end", agent: "retriever", summary: `Retrieved ${sampleChunks.length} chunks (MMR reranked)`, ms: 550 };

  // Synthesizer + token stream
  yield { type: "agent_start", agent: "synthesizer", task: "Compose grounded answer" };
  const answer =
    "Based on your documents, **revenue grew 18% YoY** with operating margin expanding to **22.4%** [^1]. The strategy memo confirms a shift toward **mid-market EMEA accounts** for FY26 [^2].";
  for (const word of answer.split(/(\s+)/)) {
    await sleep(28);
    yield { type: "token", delta: word };
  }
  yield { type: "citation", n: 1, doc_id: "doc_a", doc_name: "Quarterly Report.pdf", page: 4, chunk_id: "c-12" };
  yield { type: "citation", n: 2, doc_id: "doc_b", doc_name: "Strategy Memo.docx", page: 2, chunk_id: "c-3" };
  yield { type: "agent_end", agent: "synthesizer", summary: "Drafted answer with 2 citations", ms: 1200 };

  // Critic
  yield { type: "agent_start", agent: "critic", task: "Verify claims against retrieved chunks" };
  await sleep(400);
  yield { type: "critic", verdict: "pass" };
  yield { type: "agent_end", agent: "critic", summary: "All claims grounded", ms: 400 };

  yield { type: "done", message_id: crypto.randomUUID(), usage: { tokens: 412, ms: Date.now() - t0 } };
}
