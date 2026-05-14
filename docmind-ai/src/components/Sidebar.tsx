import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { FileText, MessageSquare, LogOut, Brain } from "lucide-react";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const loc = useLocation();
  const path = loc.pathname;

  const item = (to: string, label: string, Icon: typeof FileText) => {
    const active = path === to || path.startsWith(to + "/");
    return (
      <Link
        to={to}
        className="d-flex align-items-center gap-2 px-2 px-lg-3 py-2 rounded mb-1"
        style={{
          color: active ? "var(--dm-text)" : "var(--dm-muted)",
          background: active ? "var(--dm-surface-2)" : "transparent",
          textDecoration: "none",
          justifyContent: "flex-start",
        }}
        title={label}
      >
        <Icon size={16} />
        <span className="d-none d-lg-inline">{label}</span>
      </Link>
    );
  };

  return (
    <aside
      className="d-flex flex-column p-2 p-lg-3"
      style={{
        width: 64,
        minWidth: 64,
        height: "100vh",
        background: "var(--dm-surface)",
        borderRight: "1px solid var(--dm-border)",
      }}
      data-dm-sidebar
    >
      <style>{`
        @media (min-width: 992px) {
          aside[data-dm-sidebar] { width: 220px !important; min-width: 220px !important; }
        }
      `}</style>
      <div className="d-flex align-items-center gap-2 mb-4 px-1 px-lg-2">
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,var(--dm-accent),var(--dm-accent-2))",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}
        >
          <Brain size={18} color="#06231f" />
        </div>
        <div className="d-none d-lg-block">
          <div style={{ fontWeight: 700, letterSpacing: -0.2 }}>DocMind</div>
          <div className="dm-text-muted" style={{ fontSize: 11 }}>Multi-agent RAG</div>
        </div>
      </div>

      <nav className="flex-grow-1">
        {item("/chat", "Chat", MessageSquare)}
        {item("/documents", "Documents", FileText)}
      </nav>

      <div className="dm-divider my-2 d-none d-lg-block" />
      <div className="d-flex align-items-center justify-content-between px-1 px-lg-2">
        <div className="d-none d-lg-block" style={{ fontSize: 12, minWidth: 0 }}>
          <div className="text-truncate" style={{ maxWidth: 140 }}>{user?.email}</div>
          <div className="dm-text-muted">Signed in</div>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          title="Sign out"
          onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
