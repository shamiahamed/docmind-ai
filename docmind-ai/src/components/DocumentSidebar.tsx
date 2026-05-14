import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Loader2 } from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  status: string;
};

export function DocumentSidebar() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id,filename,status")
        .order("created_at", { ascending: false });
      setDocs((data ?? []) as Doc[]);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = docs.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d-flex flex-column h-100">
      <div className="p-3" style={{ borderBottom: "1px solid var(--dm-border)" }}>
        <h6 className="mb-3" style={{ fontWeight: 600, fontSize: 14 }}>Library</h6>
        <div className="position-relative">
          <Search
            className="position-absolute dm-text-muted"
            size={14}
            style={{ left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            className="form-control form-control-sm ps-4"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 8, fontSize: 12, background: "var(--dm-surface-2)" }}
          />
        </div>
      </div>

      <div className="flex-grow-1 p-2" style={{ overflowY: "auto" }}>
        {loading ? (
          <div className="text-center py-4">
            <Loader2 className="spinner-border-sm dm-accent" size={20} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="dm-text-muted text-center py-4" style={{ fontSize: 12 }}>
            No documents found.
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="d-flex align-items-center gap-2 p-2 mb-1 rounded"
              style={{
                fontSize: 12,
                background: "transparent",
                transition: "background 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dm-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <FileText
                size={14}
                style={{
                  color: d.status === "ready" ? "var(--dm-accent)" : "var(--dm-muted)",
                  flexShrink: 0,
                }}
              />
              <span className="text-truncate" title={d.filename}>
                {d.filename}
              </span>
              {d.status !== "ready" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--dm-warn)",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
