import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAgentStream } from "@/hooks/useAgentStream";
import { useConversations } from "@/hooks/useConversations";
import type { Citation } from "@/lib/services/types";
import { AgentTimeline } from "@/components/AgentTimeline";
import { SourcesPanel } from "@/components/SourcesPanel";
import { GroundingBadge } from "@/components/GroundingBadge";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import {
  Send,
  Plus,
  MessageSquare,
  PanelLeft,
  PanelRight,
  X,
  Trash2,
  Square,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  agent_run: {
    steps: Array<{ agent: string; task: string; status: string; ms?: number; summary?: string }>;
    critique?: { verdict: string; issues?: string[] };
    chunks?: Array<{ doc_id: string; doc_name: string; page: number; chunk_id: string; score?: number; snippet?: string }>;
  } | null;
};

// ─── Chat Page ────────────────────────────────────────────────────────────────

function ChatPage() {
  const { user, session } = useAuth();
  const convos = useConversations(user?.id);
  const { state: stream, run, stop, reset } = useAgentStream();

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState("");
  const [highlightChunk, setHighlightChunk] = useState<string | null>(null);

  // Mobile panel toggles
  const [showConvos, setShowConvos] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!convos.activeId) { setMessages([]); return; }
    supabase
      .from("messages")
      .select("id,role,content,citations,agent_run")
      .eq("conversation_id", convos.activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as StoredMessage[]));
  }, [convos.activeId]);

  // Auto-scroll on new tokens or messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, stream.draft, stream.steps.length]);

  // ─── Send ──────────────────────────────────────────────────────────────────

  const send = async () => {
    if (!input.trim() || !user || stream.streaming) return;

    let convId = convos.activeId;
    const isFirstMsg = !convId || messages.filter((m) => m.role === "user").length === 0;

    if (!convId) {
      convId = await convos.create(user.id);
      if (!convId) return;
    }

    const question = input.trim();
    setInput("");

    // Persist user message
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, user_id: user.id, role: "user", content: question })
      .select()
      .single();
    if (userMsg) setMessages((m) => [...m, userMsg as StoredMessage]);

    // Stream — returns final state when done
    const final = await run({ conversation_id: convId, question }, session?.access_token);

    // Persist assistant message
    const { data: asstMsg } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: final.draft,
        citations: final.citations,
        agent_run: {
          steps: final.steps,
          critique: final.critique,
          chunks: final.chunks,
        },
      })
      .select()
      .single();
    if (asstMsg) setMessages((m) => [...m, asstMsg as StoredMessage]);

    // Auto-title on first message
    if (isFirstMsg) {
      const title = question.slice(0, 60);
      await convos.rename(convId, title);
    }

    reset();
    inputRef.current?.focus();
  };

  // ─── Citation click ────────────────────────────────────────────────────────

  const onCitationClick = (chunkId: string) => {
    setHighlightChunk(chunkId);
    setShowSources(true);
    setTimeout(() => setHighlightChunk((v) => (v === chunkId ? null : v)), 2400);
  };

  // Sources shown: live chunks while streaming, else last assistant's chunks
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const displayedChunks = stream.streaming
    ? stream.chunks
    : (lastAssistant?.agent_run?.chunks ?? []);

  const activeTitle = convos.convos.find((c) => c.id === convos.activeId)?.title ?? "New chat";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="d-flex" style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* ── Conversation list panel ── */}
      <ConvoPanel
        open={showConvos}
        onClose={() => setShowConvos(false)}
        convos={convos.convos}
        activeId={convos.activeId}
        onSelect={(id) => { convos.setActive(id); setShowConvos(false); }}
        onNew={() => convos.create(user!.id).then(() => setShowConvos(false))}
        onDelete={(id) => convos.remove(id)}
      />

      {/* ── Main chat column ── */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {/* Top bar */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2"
          style={{ borderBottom: "1px solid var(--dm-border)", background: "var(--dm-surface)", flexShrink: 0 }}
        >
          <button className="btn btn-sm btn-ghost d-lg-none" onClick={() => setShowConvos(true)} aria-label="Open chats">
            <PanelLeft size={16} />
          </button>
          <div className="text-truncate flex-grow-1 px-2" style={{ fontSize: 14, fontWeight: 600 }}>
            {activeTitle}
          </div>
          {stream.usage && (
            <span className="dm-text-muted d-none d-md-inline me-3" style={{ fontSize: 11 }}>
              {stream.usage.tokens} tok · {stream.usage.ms}ms
            </span>
          )}
          <button className="btn btn-sm btn-ghost d-lg-none" onClick={() => setShowSources(true)} aria-label="Show sources">
            <PanelRight size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow-1 p-3 p-lg-4" style={{ overflowY: "auto" }}>
          {messages.length === 0 && !stream.streaming && (
            <EmptyState />
          )}

          {messages.map((m) => (
            <MessageRow
              key={m.id}
              msg={m}
              onCitationClick={onCitationClick}
            />
          ))}

          {/* Live streaming message */}
          {stream.streaming && (
            <div className="mb-4">
              <AgentTimeline steps={stream.steps} />
              <div className="dm-surface p-3">
                {stream.draft ? (
                  <AssistantMarkdown
                    content={stream.draft + "▋"}
                    citations={stream.citations}
                    onCite={onCitationClick}
                  />
                ) : (
                  <span className="dm-text-muted" style={{ fontSize: 13 }}>
                    Thinking…
                  </span>
                )}
                <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
                  <GroundingBadge critique={stream.critique} />
                  {stream.citations.length > 0 && (
                    <span className="dm-text-muted" style={{ fontSize: 11 }}>
                      {stream.citations.length} citation(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {stream.error && (
            <div
              className="mb-3 px-3 py-2"
              style={{ background: "rgba(255,93,108,.12)", border: "1px solid var(--dm-danger)", borderRadius: 10, fontSize: 13, color: "var(--dm-danger)" }}
            >
              Stream error: {stream.error}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-3" style={{ borderTop: "1px solid var(--dm-border)", flexShrink: 0 }}>
          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="d-flex gap-2"
          >
            <input
              ref={inputRef}
              autoFocus
              className="form-control"
              placeholder="Ask a question about your documents…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={stream.streaming}
              style={{ borderRadius: 10 }}
            />
            {stream.streaming ? (
              <button
                type="button"
                className="btn btn-outline-danger d-flex align-items-center gap-2"
                onClick={stop}
                style={{ flexShrink: 0, borderRadius: 10 }}
              >
                <Square size={14} fill="currentColor" />
                <span className="d-none d-sm-inline">Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-dm d-flex align-items-center gap-2"
                disabled={!input.trim()}
                style={{ flexShrink: 0, borderRadius: 10 }}
              >
                <Send size={14} />
                <span className="d-none d-sm-inline">Send</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ── Sources panel ── */}
      <SourcesDrawer
        open={showSources}
        onClose={() => setShowSources(false)}
        chunks={displayedChunks.map((c) => ({ ...c, _highlight: c.chunk_id === highlightChunk }))}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center mt-5 pt-5">
      <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
      <h5 style={{ color: "var(--dm-text)", marginBottom: 8 }}>Ask your documents anything</h5>
      <div className="dm-text-muted" style={{ fontSize: 13 }}>
        Try: "Compare revenue across the quarterly reports"
      </div>
    </div>
  );
}

function MessageRow({
  msg,
  onCitationClick,
}: {
  msg: StoredMessage;
  onCitationClick: (chunkId: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="d-flex justify-content-end mb-4">
        <div
          className="dm-bg-accent px-3 py-2"
          style={{ borderRadius: 14, maxWidth: "80%", lineHeight: 1.5 }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {msg.agent_run?.steps && msg.agent_run.steps.length > 0 && (
        <AgentTimeline steps={msg.agent_run.steps as Parameters<typeof AgentTimeline>[0]["steps"]} />
      )}
      <div className="dm-surface p-3">
        <AssistantMarkdown
          content={msg.content}
          citations={msg.citations ?? []}
          onCite={onCitationClick}
        />
        <div className="d-flex align-items-center gap-3 mt-2 flex-wrap">
          {msg.agent_run?.critique && (
            <GroundingBadge critique={msg.agent_run.critique as Parameters<typeof GroundingBadge>[0]["critique"]} />
          )}
          {(msg.citations?.length ?? 0) > 0 && (
            <span className="dm-text-muted" style={{ fontSize: 11 }}>
              {msg.citations!.length} citation(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AssistantMarkdown({
  content,
  citations,
  onCite,
}: {
  content: string;
  citations: Citation[];
  onCite: (chunkId: string) => void;
}) {
  const parts = content.split(/(\[\^\d+\])/g);
  return (
    <div style={{ lineHeight: 1.6 }}>
      {parts.map((p, i) => {
        const m = p.match(/^\[\^(\d+)\]$/);
        if (m) {
          const n = parseInt(m[1], 10);
          const cit = citations.find((c) => c.n === n);
          if (!cit)
            return (
              <sup key={i} className="dm-text-muted" style={{ fontSize: 10 }}>
                [{n}]
              </sup>
            );
          return (
            <button
              key={i}
              onClick={() => onCite(cit.chunk_id)}
              className="dm-citation"
              title={`${cit.doc_name} · p.${cit.page}`}
            >
              {n}
            </button>
          );
        }
        return (
          <ReactMarkdown
            key={i}
            components={{ p: ({ children }) => <span>{children}</span> }}
          >
            {p}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

function ConvoPanel({
  open,
  onClose,
  convos,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  convos: Array<{ id: string; title: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const [tab, setTab] = useState<"chats" | "library">("chats");

  return (
    <>
      {open && <div className="dm-backdrop d-lg-none" onClick={onClose} />}
      <div
        className={`dm-side-left ${open ? "open" : ""}`}
        style={{
          width: 260,
          background: "var(--dm-surface)",
          borderRight: "1px solid var(--dm-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="p-3 d-flex align-items-center justify-content-between" style={{ flexShrink: 0 }}>
          <div className="d-flex gap-2 p-1 dm-surface-2" style={{ borderRadius: 10, width: "100%" }}>
            <button
              className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${tab === "chats" ? "btn-dm" : "btn-ghost"}`}
              style={{ border: "none", fontSize: 12 }}
              onClick={() => setTab("chats")}
            >
              <MessageSquare size={14} /> Chats
            </button>
            <button
              className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 ${tab === "library" ? "btn-dm" : "btn-ghost"}`}
              style={{ border: "none", fontSize: 12 }}
              onClick={() => setTab("library")}
            >
              <FileText size={14} /> Library
            </button>
          </div>
          <button className="btn btn-sm btn-ghost d-lg-none ms-2" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {tab === "chats" ? (
          <>
            <div className="px-3" style={{ flexShrink: 0 }}>
              <button
                className="btn btn-dm w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={onNew}
                style={{ fontSize: 13 }}
              >
                <Plus size={14} /> New chat
              </button>
            </div>
            <div className="px-2" style={{ overflowY: "auto", flex: 1 }}>
              {convos.map((c) => (
                <div
                  key={c.id}
                  className="d-flex align-items-center gap-1 mb-1"
                  style={{
                    background: activeId === c.id ? "var(--dm-surface-2)" : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <button
                    onClick={() => onSelect(c.id)}
                    className="flex-grow-1 text-start px-2 py-2 d-flex align-items-center gap-2"
                    style={{
                      background: "transparent",
                      color: "var(--dm-text)",
                      border: "none",
                      fontSize: 13,
                      minWidth: 0,
                    }}
                  >
                    <MessageSquare size={13} className="dm-text-muted" style={{ flexShrink: 0 }} />
                    <span className="text-truncate">{c.title}</span>
                  </button>
                  <button
                    className="btn btn-sm btn-ghost me-1"
                    style={{ padding: "2px 6px", opacity: 0.5 }}
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    aria-label="Delete chat"
                    title="Delete chat"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {convos.length === 0 && (
                <div className="dm-text-muted px-2" style={{ fontSize: 13 }}>
                  No chats yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow-1 overflow-hidden">
            <DocumentSidebar />
          </div>
        )}
      </div>
    </>
  );
}

function SourcesDrawer({
  open,
  onClose,
  chunks,
}: {
  open: boolean;
  onClose: () => void;
  chunks: Array<{ doc_id: string; doc_name: string; page: number; chunk_id: string; score?: number; snippet?: string; _highlight?: boolean }>;
}) {
  return (
    <>
      {open && <div className="dm-backdrop d-lg-none" onClick={onClose} />}
      <div
        className={`dm-side-right ${open ? "open" : ""}`}
        style={{
          width: 320,
          background: "var(--dm-surface)",
          borderLeft: "1px solid var(--dm-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="p-2 d-flex justify-content-end d-lg-none" style={{ flexShrink: 0 }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="p-3" style={{ flex: 1, overflow: "hidden" }}>
          <SourcesPanel chunks={chunks} />
        </div>
      </div>
    </>
  );
}
