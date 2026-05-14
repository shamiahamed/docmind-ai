import type { ChunkRef } from "@/lib/services/types";
import { FileText } from "lucide-react";

type Highlightable = ChunkRef & { _highlight?: boolean };

export function SourcesPanel({ chunks }: { chunks: Highlightable[] }) {
  if (!chunks.length) {
    return (
      <div className="dm-surface p-3" style={{ height: "100%" }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <FileText size={14} /> <strong>Sources</strong>
        </div>
        <div className="dm-text-muted" style={{ fontSize: 13 }}>
          Retrieved chunks will appear here as agents work.
        </div>
      </div>
    );
  }
  return (
    <div className="dm-surface p-3" style={{ height: "100%", overflowY: "auto" }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <FileText size={14} /> <strong>Sources</strong>
        <span className="dm-text-muted" style={{ fontSize: 12 }}>({chunks.length})</span>
      </div>
      {chunks.map((c, i) => (
        <div
          key={c.chunk_id}
          id={`src-${c.chunk_id}`}
          className={`dm-surface-2 p-2 mb-2 ${c._highlight ? "dm-flash" : ""}`}
          style={{ fontSize: 13 }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong className="text-truncate" style={{ maxWidth: 180 }}>
              [{i + 1}] {c.doc_name}
            </strong>
            <span className="dm-text-muted" style={{ fontSize: 11 }}>
              p.{c.page} · {(c.score ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="dm-text-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
            {c.snippet}
          </div>
        </div>
      ))}
    </div>
  );
}
