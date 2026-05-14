# DocMind — Updated Plan with Multi-Agent LangGraph

Everything from the prior plan stands (Hybrid: Lovable React+Bootstrap frontend + external FastAPI/LangGraph/ChromaDB backend, per-user auth via Lovable Cloud, SSE streaming, mock→live service layer). This revision **replaces the single-agent self-correction graph with a supervisor-led multi-agent system** and adjusts the API contract, streaming events, and dev phases accordingly.

---

## 1. Multi-Agent Architecture (Supervisor Pattern)

```text
                ┌─────────────────────┐
   user query → │  Supervisor Agent   │ ──► routes by intent
                └──────────┬──────────┘
                           │ handoff (tool-call)
       ┌───────────────────┼─────────────────────────────┐
       ▼                   ▼                ▼            ▼
 Retriever Agent   Comparison Agent   Summarizer    Math/Table Agent
 (semantic +       (multi-doc         Agent         (numeric/table
  hybrid search    diff & align)     (long-doc       extraction & calc
  over Chroma)                        reduce)        from chunks)
       └───────────────────┼─────────────────────────────┘
                           ▼
                 ┌─────────────────────┐
                 │  Synthesizer Agent  │  (drafts answer + citations)
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │   Critic Agent      │  (grounding + citation check)
                 └──────────┬──────────┘
                            │ pass ──► stream to user
                            └─ fail ─► loop back to Supervisor (max 2)
```

### Agents and responsibilities

| Agent | Role | Tools | Model |
|---|---|---|---|
| **Supervisor** | Classifies intent (qa / compare / summarize / compute), plans agent calls, owns the loop budget | `route_to(agent, task)` handoff tool | GPT-4o |
| **Retriever** | Query rewriting, multi-query expansion, semantic + BM25 hybrid search, MMR rerank | `chroma.search`, `bm25.search`, `rerank` | GPT-4o-mini |
| **Comparison** | Aligns chunks across 2+ docs, produces structured diff facts | `chroma.search(filter=doc_id)` | GPT-4o |
| **Summarizer** | Map-reduce summarization for long docs / sections | `chroma.fetch_section` | GPT-4o-mini |
| **Math/Table** | Pulls numeric/table chunks, runs calculations via Python tool | `chroma.search`, `python_exec` | GPT-4o |
| **Synthesizer** | Composes final markdown answer with inline `[^n]` citations | none (pure LLM) | GPT-4o |
| **Critic** | Verifies every claim ↔ chunk; flags hallucinations; can request a re-run | `chroma.fetch(chunk_id)` | GPT-4o-mini |

### LangGraph state

```python
class AgentState(TypedDict):
    user_id: str
    conversation_id: str
    question: str
    intent: Literal["qa","compare","summarize","compute"]
    plan: list[AgentTask]
    scratchpad: list[AgentMessage]   # inter-agent messages
    retrieved: list[Chunk]
    draft: str
    citations: list[Citation]
    critique: Critique | None
    iterations: int                  # supervisor loop counter, max 2
```

### Handoff protocol

- Supervisor invokes specialists via a typed `route_to` tool call (LangGraph `Command(goto=..., update=...)`).
- Each specialist returns a structured `AgentMessage { agent, output, evidence[] }` appended to `scratchpad`.
- Synthesizer reads `retrieved + scratchpad`; Critic reads `draft + retrieved`.
- Loop guard: `iterations < 2` or Supervisor force-finalizes.

---

## 2. Streaming (SSE) — Updated Event Schema

`POST /chat/stream` emits events so the UI can render agent activity, not just tokens:

| Event | Payload | UI use |
|---|---|---|
| `agent_start` | `{agent, task}` | Show "Retriever searching…" chip |
| `agent_end` | `{agent, summary, ms}` | Collapse chip, show duration |
| `retrieval` | `{chunks:[{doc,page,score}]}` | Live "sources" panel |
| `token` | `{delta}` | Stream answer body |
| `citation` | `{n, doc_id, page, chunk_id}` | Bind `[^n]` to source |
| `critic` | `{verdict, issues?}` | Show grounding badge |
| `done` | `{message_id, usage}` | Finalize |
| `error` | `{code, message}` | Toast |

---

## 3. Frontend Adjustments (React + Bootstrap)

New components on top of the prior plan:

- `AgentTimeline.tsx` — vertical stepper showing Supervisor → specialists → Critic with live status.
- `SourcesPanel.tsx` — updates on `retrieval` events; click citation `[^n]` scrolls to chunk + opens PDF preview at page.
- `GroundingBadge.tsx` — green/yellow/red from Critic verdict.
- `useAgentStream(conversationId)` — SSE hook that demultiplexes the events above into a reducer.

State (Zustand): adds `agentRuns: Record<messageId, AgentRun>` with per-agent status, durations, and evidence.

Service layer mocks emit the same SSE event sequence so UI is fully buildable before backend exists.

---

## 4. FastAPI Backend Spec — Deltas

- `app/agents/` package: `supervisor.py`, `retriever.py`, `comparison.py`, `summarizer.py`, `math_table.py`, `synthesizer.py`, `critic.py`, `graph.py` (LangGraph wiring), `tools.py` (Chroma/BM25/python_exec/rerank).
- New endpoint metadata: `GET /agents` returns the agent roster + descriptions (used by the UI legend).
- `python_exec` tool runs in a sandboxed subprocess with timeout + no network.
- Per-user Chroma collection naming unchanged: `user_{uid}`. Filters by `doc_id` for Comparison agent.

Request/response models add:
```python
class AgentTask(BaseModel): agent: str; task: str
class AgentMessage(BaseModel): agent: str; output: str; evidence: list[ChunkRef]
class Critique(BaseModel): verdict: Literal["pass","revise","fail"]; issues: list[str]
```

---

## 5. Error Handling & Guardrails

- **Loop budget**: Supervisor hard-stops at 2 iterations; Critic `fail` after budget → return best-effort draft with a warning banner.
- **Tool timeouts**: each specialist has a 20s soft / 30s hard cap; Supervisor records timeout in scratchpad and proceeds.
- **Empty retrieval**: Retriever returns `no_context` → Synthesizer answers "I don't have enough info in your documents" instead of hallucinating.
- **Cost ceiling**: per-question token budget; Supervisor downgrades models (4o → 4o-mini) when nearing cap.

---

## 6. Updated Development Phases

1. **Foundations** — Lovable Cloud auth, profiles, Bootstrap shell, routing, dark mode.
2. **Mock service layer** — emit full multi-agent SSE event stream from a fake; build `AgentTimeline`, `SourcesPanel`, `GroundingBadge`, chat UI end-to-end against the mock.
3. **Document UX** — upload, list, delete, status polling (still mocked).
4. **Backend skeleton (external repo)** — FastAPI app, auth (Supabase JWT verify), Chroma init, `/documents` CRUD, ingestion worker.
5. **Single-agent baseline** — Retriever + Synthesizer only, real SSE, validate end-to-end with frontend.
6. **Multi-agent rollout** — add Supervisor, Comparison, Summarizer, Math/Table, Critic; wire LangGraph; per-agent tracing (LangSmith optional).
7. **Hardening** — rate limits, loop/cost guards, error toasts, observability, deploy docs (frontend on Lovable, backend Dockerfile + Fly/Render compose).

---

## 7. What changes vs. previous plan

- Graph topology: single self-correcting agent → **supervisor + 5 specialists + critic**.
- SSE schema gains `agent_start/agent_end/critic` events.
- Frontend gains `AgentTimeline` and `GroundingBadge`; SourcesPanel becomes live-updating.
- Backend folder grows an `agents/` package and a sandboxed `python_exec` tool.
- Phase 5 splits into "single-agent baseline" then "multi-agent rollout" to de-risk integration.

Approve this and I'll start Phase 1 (Lovable Cloud auth + Bootstrap shell + mocked multi-agent SSE).
