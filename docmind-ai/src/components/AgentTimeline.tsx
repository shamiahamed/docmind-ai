import { useState } from "react";
import type { AgentRunStep, AgentName } from "@/lib/services/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const LABELS: Record<AgentName, string> = {
  supervisor: "Supervisor",
  retriever: "Retriever",
  comparison: "Comparison",
  summarizer: "Summarizer",
  math_table: "Math / Table",
  synthesizer: "Synthesizer",
  critic: "Critic",
};

const COLORS: Record<AgentName, string> = {
  supervisor: "#7c5cff",
  retriever: "#4fd1c5",
  comparison: "#f4b740",
  summarizer: "#60a5fa",
  math_table: "#fb923c",
  synthesizer: "#4ade80",
  critic: "#f472b6",
};

export function AgentTimeline({ steps }: { steps: AgentRunStep[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!steps.length) return null;

  const hasRunning = steps.some((s) => s.status === "running");
  const totalMs = steps.reduce((acc, s) => acc + (s.ms ?? 0), 0);
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div
      className="mb-2"
      style={{
        background: "var(--dm-surface-2)",
        border: "1px solid var(--dm-border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-100 d-flex align-items-center gap-2 px-3 py-2"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--dm-text)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Running pulse dot or done check */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            background: hasRunning ? "var(--dm-accent)" : "var(--dm-ok)",
            boxShadow: hasRunning ? "0 0 0 4px rgba(79,209,197,.2)" : "none",
            animation: hasRunning ? "dmPulse 1.2s infinite" : "none",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, flexGrow: 1 }}>
          {hasRunning
            ? `Agent running…`
            : `${doneCount} agent${doneCount !== 1 ? "s" : ""} · ${totalMs}ms`}
        </span>
        {/* Mini pipeline dots */}
        <div className="d-flex gap-1 me-2">
          {steps.map((s, i) => (
            <span
              key={i}
              title={`${LABELS[s.agent]}${s.summary ? ": " + s.summary : ""}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  s.status === "running"
                    ? COLORS[s.agent]
                    : s.status === "done"
                    ? "#4ade80"
                    : "#ff5d6c",
                opacity: s.status === "running" ? 1 : 0.7,
              }}
            />
          ))}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expandable detail rows */}
      {expanded && (
        <div
          style={{ borderTop: "1px solid var(--dm-border)", padding: "8px 12px 10px" }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              className="d-flex align-items-start gap-2 py-1"
              style={{ fontSize: 12 }}
            >
              {/* Colored agent dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 4,
                  background: COLORS[s.agent],
                  boxShadow:
                    s.status === "running"
                      ? `0 0 0 3px ${COLORS[s.agent]}33`
                      : "none",
                  animation: s.status === "running" ? "dmPulse 1.2s infinite" : "none",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: COLORS[s.agent] }}>
                  {LABELS[s.agent]}
                </span>
                <span className="dm-text-muted" style={{ marginLeft: 6 }}>
                  {s.status === "running"
                    ? s.task
                    : s.summary || s.task}
                </span>
              </div>
              {s.ms != null && (
                <span className="dm-text-muted" style={{ flexShrink: 0 }}>
                  {s.ms}ms
                </span>
              )}
              {s.status === "running" && (
                <span
                  className="dm-text-muted"
                  style={{ flexShrink: 0, fontStyle: "italic" }}
                >
                  …
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
