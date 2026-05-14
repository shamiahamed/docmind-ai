import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string | null;
  status: string;
  pages: number | null;
  chunks: number | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load documents from our Backend API (which now syncs with Supabase)
  const load = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE}/documents`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      console.error(e);
      showError("Could not load your library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void load();
    
    // Polling for status updates every 5 seconds if documents are processing
    const interval = setInterval(() => {
      const hasProcessing = docs.some(d => d.status !== 'ready' && d.status !== 'failed');
      if (hasProcessing) void load();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, docs.length]); // Refresh polling logic when list changes

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const array = Array.from(files);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    for (const f of array) {
      info(`Uploading ${f.name}...`);
      
      const formData = new FormData();
      formData.append("file", f);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/documents/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const newDoc = await res.json();
        
        setDocs(prev => [newDoc, ...prev]);
        success(`${f.name} uploaded successfully! Processing started.`);
      } catch (e) {
        showError(`Failed to upload ${f.name}`);
        console.error(e);
      }
    }
  };

  const remove = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE}/documents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");
      
      setDocs(prev => prev.filter(x => x.id !== id));
      success("Document deleted");
    } catch (e) {
      showError("Failed to delete document");
    }
  };

  const filtered = useMemo(() => {
    return docs.filter((d) =>
      d.filename.toLowerCase().includes(search.toLowerCase())
    );
  }, [docs, search]);

  return (
    <div className="p-4 p-lg-5" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
        <div>
          <h1 className="h3 mb-1" style={{ fontWeight: 700 }}>Library</h1>
          <div className="dm-text-muted" style={{ fontSize: 14 }}>
            Manage your knowledge base. Supported: PDF, DOCX.
          </div>
        </div>
        <button
          className="btn btn-dm d-flex align-items-center justify-content-center gap-2 px-4 py-2 shadow-sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={16} /> Upload documents
        </button>
        <input
          ref={fileRef}
          type="file"
          className="d-none"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
        <div className="position-relative flex-grow-1">
          <Search
            className="position-absolute dm-text-muted"
            size={16}
            style={{ left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            className="form-control ps-5 py-2"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 12, fontSize: 14 }}
          />
        </div>
        <div className="d-flex gap-1 p-1 dm-surface-2" style={{ borderRadius: 10 }}>
          <button
            className={`btn btn-sm ${view === "grid" ? "btn-dm" : "btn-ghost"}`}
            style={{ border: "none", padding: "6px 12px" }}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`btn btn-sm ${view === "list" ? "btn-dm" : "btn-ghost"}`}
            style={{ border: "none", padding: "6px 12px" }}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Loader2 className="spinner-border-sm dm-accent mb-2" size={32} style={{ animation: "spin 1s linear infinite" }} />
          <div className="dm-text-muted">Loading your library…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="dm-surface p-5 text-center"
          style={{ borderStyle: "dashed", cursor: "pointer", borderRadius: 20 }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="mb-3" style={{ fontSize: 40 }}>📁</div>
          <h5 style={{ fontWeight: 600 }}>{search ? "No matches found" : "Your library is empty"}</h5>
          <p className="dm-text-muted mx-auto" style={{ maxWidth: 300, fontSize: 13 }}>
            {search ? "Try adjusting your search terms." : "Upload your first document to start."}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((d) => (
            <div key={d.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <div className="dm-surface p-3 h-100 d-flex flex-column gap-2 hover-lift">
                <div className="d-flex align-items-start justify-content-between">
                  <div
                    className="dm-surface-2 p-2 d-flex align-items-center justify-content-center"
                    style={{ borderRadius: 10, color: "var(--dm-accent)" }}
                  >
                    <FileText size={20} />
                  </div>
                  <button className="btn btn-sm btn-ghost p-1" onClick={() => remove(d.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex-grow-1 min-w-0 mt-1">
                  <div className="text-truncate" style={{ fontWeight: 600, fontSize: 14 }} title={d.filename}>
                    {d.filename}
                  </div>
                  <div className="dm-text-muted" style={{ fontSize: 11 }}>
                    {(d.size_bytes / 1024).toFixed(1)} KB · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-2 pt-2" style={{ borderTop: "1px solid var(--dm-border)" }}>
                  <StatusBadge status={d.status} />
                  <div className="dm-text-muted" style={{ fontSize: 11 }}>
                    {d.pages ? `${d.pages}p` : ""} {d.chunks ? `· ${d.chunks}c` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hover-lift { transition: transform 0.2s; }
        .hover-lift:hover { transform: translateY(-4px); }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return <span className="dm-chip done"><span className="dot" /> Ready</span>;
  if (status === "failed") return <span className="dm-chip fail"><span className="dot" /> Failed</span>;
  return <span className="dm-chip running"><span className="dot" /> {status}</span>;
}
